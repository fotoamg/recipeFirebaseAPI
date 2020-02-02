
module.exports = function (fm) {

    function addUser(userid, email, firstname, lastname) {
        return new Promise((resolve, reject) => {
            const obj = {
                email: email,
                firstname: firstname,
                lastname: lastname
            }
            fm.post(`users/${userid}`, obj, '')
                .then(ref => resolve(ref))
                .catch(error => reject(error));
        })
    }

    function addConnectedUser(userId, connectedUserId, token) {
        return new Promise((resolve, reject) => {
            const obj = {
                userid: connectedUserId
            }
            fm.post(`usersconnections/${userId}`, obj, token)
                .then(ref => resolve(ref))
                .catch(error => reject(error));
        })
    }

    function listConnectedUsers(userId, token) {
        console.log(userId)
        return new Promise((resolve, reject) => {
            fm.get(`usersconnections/${userId}`, token)
                .then(data => {
                    let list = []
                    for (const key in data) {
                        list.push(data[key].userid)
                    }
                    resolve(list)
                })
                .catch(error => reject(error))
        })
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
        addUser: addUser,
        addConnectedUser: addConnectedUser,
        listConnectedUsers: listConnectedUsers,

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