module.exports = function (app, recipesLogic) {

    app.route('/api/recipes').get((req, res, next) => {
        
        if (req.query.categories) {
          const categories = req.query.categories.split(', ');    
          const userId = req.query.userid;
          const token = req.query.token;
          recipesLogic.getRecipeSelectList(userId, categories, token).then(list => {
              res.send(list);
          }).catch(error => {
              next(error);
          });
        } else {
            const token = req.query.token;
            recipesLogic.listRecipes(token).then(list => {
                 res.send(list);
            }).catch(error => {
                    next(error);
            });
        }
        
    })

    app.route('/api/recipes/:id').get((req, res, next) => {
        const id = req.params['id'];
        const token = req.query.token;
        recipesLogic.getRecipe(id, token).then(recipe => res.send(recipe)).catch(error => next(error));
    }) 

    app.route('/api/categories').get((req, res, next) => {
        const token = req.query.token;
        recipesLogic.listCategories(token).then(list => res.send(list)).catch(error=> next(error));
    })

    app.route('/api/categories').post((req, res, next) => {
        const token = req.query.token;
        const title = req.body['title'];
        recipesLogic.addCategory(title, token).then(categoryId => res.send(200, categoryId)).catch(error => next(error));
    })

    app.route('/api/init').get((req, res, next) => {
        const userid = req.query.userid;
        const token = req.query.token;
        recipesLogic.clearDb(token).then(ref => {
            recipesLogic.initRecipesFromJson('./data/myreceipts.json', userid, token)
                .then(() => res.send("Init OK"))
                .catch(error => next(error))
        })
            .catch(error => {
                next(error)
            })
    })

    app.route('/api/save').get((req, res, next) => {
        const fs = require('fs');
        const token = req.query.token;
        recipesLogic.getRecipesToSave(token)
            .then(list => {
                const data = JSON.stringify(list, null, 2);
                fs.writeFile('./data/recipes_saved.json', data, (err) => {
                    if (err) next(err);
                    res.send("Save OK");
                });
            })
            .catch(error => next(error));
    })


}