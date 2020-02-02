module.exports = function (ds) {

    function getRecipeSelectList(userId, categories, token) {
        return new Promise((resolve, reject) => {
            ds.listRecipesByUserByCategories(userId, categories, token)
                .then(data => {
                    let result = {
                        userId: data.userId,
                        list: data.list.map(mapRecipeToListItem),
                        connectedLists: []
                    };
                    ds.listConnectedUsers(userId, token)
                        .then(userList => {
                            console.log(userList)
                            let promises = []
                            userList.forEach(conUserId => {
                                promises.push(ds.listRecipesByUserByCategories(conUserId, categories, token))
                            })
                            Promise.all(promises)
                                .then(dataList => {
                                    dataList.forEach(data => {
                                        result.connectedLists.push({
                                            userId: data.userId,
                                            list: data.list.map(mapRecipeToListItem)
                                        })
                                    })
                                    resolve(result)
                                })
                                .catch(error => reject(error))
                        })
                        .catch(error => reject(error))
                })
                .catch(error => reject(error));
        });
    }

    function mapRecipeToListItem(recipe) {
        let ingredients = '';
        let firstIng = true;
        recipe.data.ingredients.forEach(ing => {
            if (firstIng) {
                ingredients += ing.title;
                firstIng = false;
            } else {
                ingredients += `, ${ing.title}`;
            }
        });
        let result = {
            id: recipe.id,
            title: recipe.data.title,
            ingredients: ingredients
        }
        return result;
    }

    function getRecipesToSave(token) {
        return new Promise((resolve, reject) => {
            ds.listRecipes(token)
                .then(list => {
                    let promises = [];
                    list.forEach(recipe => {
                        promises.push(mapRecipeToSavedJson(recipe, token));
                    })
                    Promise.all(promises)
                        .then(list => resolve(list))
                        .catch(error => reject(error))
                })
                .catch(error => reject(error))
        });
    }

    function mapRecipeToSavedJson(recipe, token) {
        return new Promise((resolve, reject) => {
            let ingredients = '';
            let firstIng = true;
            recipe.data.ingredients.forEach(ing => {
                let ingWithAmount = ing.amount.trim();
                if (ingWithAmount.length > 0) {
                    ingWithAmount += ` ${ing.title.trim()}`;
                } else {
                    ingWithAmount = `${ing.title.trim()}`;
                }
                if (firstIng) {
                    ingredients += ingWithAmount;
                    firstIng = false;
                } else {
                    ingredients += `, ${ingWithAmount}`;
                }
            });
            let directions = '';
            for (let i = 0; i < recipe.data.directions.length; i++) {
                directions += `${recipe.data.directions[i].direction}\n`;
            }
            let promises = [];
            recipe.data.categories.forEach(categoryId => {
                promises.push(ds.getCategory(categoryId, token));
            })
            Promise.all(promises)
                .then(categories => {
                    let result = {
                        //id: recipe.id,
                        title: recipe.data.title,
                        ingredients: ingredients,
                        directions: directions,
                        categories: ''
                    }
                    let firstCat = true;
                    categories.forEach(c => {
                        if (firstCat) {
                            firstCat = false;
                            result.categories = c.title;
                        } else {
                            result.categories += `, ${c.title}`;
                        }
                    });
                    resolve(result);
                })
                .catch(error => reject(error))
        });
    }

    function getRecipe(id, token) {
        return new Promise((resolve, reject) => {
            ds.getRecipe(id, token)
                .then(recipe => {
                    let promises = [];
                    recipe.data.categories.forEach(categoryId => {
                        promises.push(ds.getCategory(categoryId, token));
                    })
                    Promise.all(promises)
                        .then(categories => {
                            resolve({
                                id: recipe.id,
                                title: recipe.data.title,
                                ingredients: recipe.data.ingredients,
                                directions: recipe.data.directions,
                                categories: categories
                            });
                        })
                        .catch(error => reject(error))
                })
                .catch(error => reject(error))
        })
    }

    function addRecipe(title, ingredients, directions, categories, userId, categoryList, token) {
        return new Promise((resolve, reject) => {

            let ingredientList = []
            var ins = ingredients.split(',');
            ins.forEach(ing => {
                var is = ing.split(' ');
                var i = is[is.length - 1];
                var a = '';
                if (is.length > 1) {
                    for (j = 0; j < is.length - 1; j++) {
                        a = a + ' ' + is[j];
                    }
                }
                ingredientList.push({ "title": i, "amount": a });
            });
            let directionList = [];
            var dirs = directions.split('\n');
            dirs.forEach(dir => {
                directionList.push({ "direction": dir });
            });
            var cs = categories.split(",");
            var catids = [];
            cs.forEach(cat => {
                const categoryTitle = cat.trim();
                categoryList.forEach(cl => {
                    if (cl.title == categoryTitle) {
                        catids.push(cl.id);
                    }
                })
            });
            ds.addRecipe(title, ingredientList, directionList, catids, token)
                .then(recipeId => {
                    var ps = [];
                    catids.forEach(categoryId => {
                        ps.push(ds.addUsersRecipe(userId, categoryId, recipeId, token));
                        ps.push(ds.addCategoriesRecipe(categoryId, recipeId, token));
                    })
                    Promise.all(ps)
                        .then(ref => resolve(ref))
                        .catch(error => reject(error))
                })
                .catch(error => reject(error))

        });
    }

    function clearDb(token) {
        return new Promise((resolve, reject) => {
            var promises = [];
            promises.push(ds.delCollection('categoriesrecipes', token));
            promises.push(ds.delCollection('usersrecipes', token));
            promises.push(ds.delCollection('categories', token));
            promises.push(ds.delCollection('recipes', token));
            Promise.all(promises).then(ref => resolve()).catch(error => reject(error));
        });
    }

    function initRecipesFromJson(jsonFile, uid, token) {
        console.log("initRecipesFromJson")
        const fs = require('fs');
        return new Promise((resolve, reject) => {
            fs.readFile(jsonFile, (error, data) => {
                if (error) throw error;
                let recipes = JSON.parse(data);
                let categoryTitles = [];
                recipes.forEach(r => {
                    var cs = r.categories.split(",");
                    cs.forEach(c => {
                        if (categoryTitles.indexOf(c) < 0) {
                            categoryTitles.push(c)
                        }
                    })
                })
                var catPromises = []
                categoryTitles.forEach(title => {
                    catPromises.push(ds.addCategory(title, token))
                })
                Promise.all(catPromises)
                    .then(cats => {
                        var promises = [];
                        recipes.forEach(r => {
                            promises.push(addRecipe(r.title, r.ingredients, r.directions, r.categories, uid, cats, token))
                        });
                        Promise.all(promises)
                            .then(ref => resolve(ref))
                            .catch(error => reject(error))

                    })
                    .catch(error => reject(error))
            });
        });
    }

    return {
        getRecipeSelectList: getRecipeSelectList,
        getRecipesToSave: getRecipesToSave,
        getRecipe: getRecipe,

        clearDb: clearDb,
        initRecipesFromJson: initRecipesFromJson

    };
}