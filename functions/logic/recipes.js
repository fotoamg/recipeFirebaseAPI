module.exports = function (authLogic, fm) {

    function getRecipeSelectList(userId, categories, token) {
        return new Promise((resolve, reject) => {
            listRecipesByUserByCategories(userId, categories, token)
                .then(data => {
                    let result = {
                        userId: data.userId,
                        list: data.list.map(mapRecipeToListItem),
                        connectedLists: []
                    };
                    authLogic.listConnectedUsers(userId, token)
                        .then(userList => {
                            console.log(userList)
                            let promises = []
                            userList.forEach(conUserId => {
                                promises.push(listRecipesByUserByCategories(conUserId, categories, token))
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
            listRecipes(token)
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
                promises.push(getCategory(categoryId, token));
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
            getRecipe(id, token)
                .then(recipe => {
                    let promises = [];
                    recipe.data.categories.forEach(categoryId => {
                        promises.push(getCategory(categoryId, token));
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
            const ins = ingredients.split(',');
            ins.forEach(ing => {
                const is = ing.split(' ');
                const i = is[is.length - 1];
                const a = '';
                if (is.length > 1) {
                    for (j = 0; j < is.length - 1; j++) {
                        a = a + ' ' + is[j];
                    }
                }
                ingredientList.push({ "title": i, "amount": a });
            });
            let directionList = [];
            const dirs = directions.split('\n');
            dirs.forEach(dir => {
                directionList.push({ "direction": dir });
            });
            const cs = categories.split(",");
            const catids = [];
            cs.forEach(cat => {
                const categoryTitle = cat.trim();
                categoryList.forEach(cl => {
                    if (cl.title == categoryTitle) {
                        catids.push(cl.id);
                    }
                })
            });
            addRecipe(title, ingredientList, directionList, catids, token)
                .then(recipeId => {
                    const ps = [];
                    catids.forEach(categoryId => {
                        ps.push(addUsersRecipe(userId, categoryId, recipeId, token));
                        ps.push(addCategoriesRecipe(categoryId, recipeId, token));
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
            const promises = [];
            promises.push(delCollection('categoriesrecipes', token));
            promises.push(delCollection('usersrecipes', token));
            promises.push(delCollection('categories', token));
            promises.push(delCollection('recipes', token));
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
                    const cs = r.categories.split(",");
                    cs.forEach(c => {
                        if (categoryTitles.indexOf(c) < 0) {
                            categoryTitles.push(c)
                        }
                    })
                })
                const catPromises = []
                categoryTitles.forEach(title => {
                    catPromises.push(addCategory(title, token))
                })
                Promise.all(catPromises)
                    .then(cats => {
                        const promises = [];
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

    function listRecipes(token) {
        return new Promise((resolve, reject) => {
            fm.get('recipes', token)
                .then(data => {
                    let list = [];
                    for (const key in data) {
                        let value = data[key];
                        let recipe = {
                            id: key,
                            data: value
                        }
                        list.push(recipe);
                    }
                    resolve(list);
                })
                .catch(error => reject(error))
        });
    }

    function listRecipesByUserByCategories(userId, categories, token) {
        return new Promise((resolve, reject) => {
            let promises = [];
            listRecipeIdsByUser(userId, categories, token)
                .then(ids => {
                    ids.forEach(id => {
                        promises.push(getRecipe(id, token));
                    })
                    Promise.all(promises)
                        .then(list => resolve( {
                            userId: userId,
                            list: list
                        }))
                        .catch(error => reject(error));
                })
                .catch(error => reject(error))
        })
    }

    function listRecipeIdsByUser(userId, categories, token) {
        return new Promise((resolve, reject) => {
            let promises = []
            categories.forEach(catId => {
                promises.push(listRecipeIdsByUserByCategory(userId, catId, token));
            })
            Promise.all(promises)
                .then(lists => {
                    let list = [];
                    lists.forEach(l => {
                        l.forEach(e => {
                            if (list.indexOf(e) < 0) {
                                list.push(e);
                            }
                        })
                    })
                    resolve(list);
                })
                .catch(error => reject(error));
        })
    }

    function listRecipeIdsByUserByCategory(userId, categoryId, token) {
        return new Promise((resolve, reject) => {
            const path = `usersrecipes/${userId}/${categoryId}`;
            fm.get(path, token)
                .then(data => {
                    let list = [];
                    for (const key in data) {
                        let value = data[key];
                        list.push(value.recipeId);
                    }
                    resolve(list);
                })
                .catch(error => reject(error))
        })
    }

    function getRecipe(id, token) {
        return new Promise((resolve, reject) => {
            const path = `recipes/${id}`;
            fm.get(path, token)
                .then(data => {
                    resolve({
                        id: id,
                        data: data
                    })
                })
                .catch(error => reject(error))
        })
    }

    function addRecipe(title, ingredients, directions, categoryIds, token) {
        return new Promise((resolve, reject) => {
            const obj = {
                title: title,
                ingredients: ingredients,
                directions: directions,
                categories: categoryIds
            };
            fm.post(`recipes`, obj, token)
                .then(ref => resolve(ref.name))
                .catch(error => reject(error));
        })
    }

    function listCategories(token) {
        return new Promise((resolve, reject) => {
            fm.get('categories', token)
                .then(data => {
                    let list = [];
                    for (const key in data) {
                        let value = data[key];
                        let category = {
                            id: key,
                            title: value.title
                        }
                        list.push(category);
                    }
                    resolve(list);
                })
                .catch(error => reject(error))
        })
    }

    function getCategory(id, token) {
        return new Promise((resolve, reject) => {
            const path = `categories/${id}`;
            fm.get(path, token)
                .then(data => {
                    resolve({
                        id: id,
                        title: data.title
                    })
                })
                .catch(error => reject(error))
        })
    }

    function addCategory(title, token) {
        return new Promise((resolve, reject) => {
            const obj = {
                title: title
            };
            fm.post('categories', obj, token)
                .then(ref => resolve({id: ref.name, title: title}))
                .catch(error => reject(error));
        });
    }

    function addUsersRecipe(userId, categoryId, recipeId, token) {
        return new Promise((resolve, reject) => {
            const obj = {
                recipeId: recipeId
            };
            fm.post(`usersrecipes/${userId}/${categoryId}`, obj, token)
                .then(ref => resolve(ref))
                .catch(error => reject(error));
        });
    }

    function addCategoriesRecipe(categoryId, recipeId, token) {
        return new Promise((resolve, reject) => {
            const obj = {
                recipeId: recipeId
            };
            fm.post(`categoriesrecipes/${categoryId}`, obj, token)
                .then(ref => resolve(ref))
                .catch(error => reject(error));
        });
    }

    function delCollection(path, token) {
        return new Promise((resolve, reject) => {
            fm.del(path, null, token)
                .then(ref => resolve(ref))
                .catch(error => {
                    console.log(error)
                    reject(error)
                })
        })
    }


    return {
        getRecipeSelectList: getRecipeSelectList,
        getRecipesToSave: getRecipesToSave,
        getRecipe: getRecipe,

        clearDb: clearDb,
        initRecipesFromJson: initRecipesFromJson,
        listRecipes: listRecipes,
        listRecipesByUserByCategories: listRecipesByUserByCategories,
        getRecipe: getRecipe,
        addRecipe: addRecipe,

        listCategories: listCategories,
        getCategory: getCategory,
        addCategory: addCategory,

        addUsersRecipe: addUsersRecipe,
        addCategoriesRecipe: addCategoriesRecipe,

        delCollection: delCollection
    };
}