module.exports = function (app, ds, recipesBll) {

    app.route('/api/recipes').get((req, res, next) => {
        
        if (req.query.categories) {
          const categories = req.query.categories.split(', ');    
          const userId = req.query.userid;
          const token = req.query.token;
          recipesBll.getRecipeSelectList(userId, categories, token).then(list => {
              res.send(list);
          }).catch(error => {
              next(error);
          });
        } else {
            const token = req.query.token;
            ds.listRecipes(token).then(list => {
                 res.send(list);
            }).catch(error => {
                    next(error);
            });
        }
        
    })

    app.route('/api/recipes/:id').get((req, res, next) => {
        const id = req.params['id'];
        const token = req.query.token;
        recipesBll.getRecipe(id, token).then(recipe => res.send(recipe)).catch(error => next(error));
    }) 

    app.route('/api/categories').get((req, res, next) => {
        const token = req.query.token;
        ds.listCategories(token).then(list => res.send(list)).catch(error=> next(error));
    })

    app.route('/api/categories').post((req, res, next) => {
        const token = req.query.token;
        const title = req.body['title'];
        ds.addCategory(title, token).then(categoryId => res.send(200, categoryId)).catch(error => next(error));
    })

    app.route('/api/init').get((req, res, next) => {
        const userid = req.query.userid;
        const token = req.query.token;
        recipesBll.clearDb(token).then(ref => {
            recipesBll.initRecipesFromJson('./data/myreceipts.json', userid, token)
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
        recipesBll.getRecipesToSave(token)
            .then(list => {
                let data = JSON.stringify(list, null, 2);
                fs.writeFile('./data/recipes_saved.json', data, (err) => {
                    if (err) next(err);
                    res.send("Save OK");
                });
            })
            .catch(error => next(error));
    })


}