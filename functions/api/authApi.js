module.exports = function (app, firebase, authLogic) {
    app.route('/api/auth/login/:email/:password').get((req, res, next) => {
        const email = req.params['email'];
        const password = req.params['password'];
        authLogic.login(email, password)
            .then(data => res.send(data))
            .catch(error => next(error)) 
    })
    app.route('/api/auth/logout').put((req, res) => {
        firebase.auth().signOut()
            .then(() => {
                res.send(200, req.body);
            });
    })
    app.route('/api/auth/users').post((req, res, next) => {
        const email = req.body['email'];
        const password = req.body['password'];
        const firstname = req.body['firstname'];
        const lastname = req.body['lastname'];
        firebase.auth().createUserWithEmailAndPassword(email, password)
            .then(response => {
                authLogic.addUser(response.user.uid, email, firstname, lastname)
                    .then(userId => {
                        console.log(userId)
                        res.send(200, userId);
                    })
                    .catch(error => {
                        //console.log(error.message)
                        next(error)
                    })
            })
            .catch(error => {
                console.log(error)
                next(error)
            }
            );

    })

    app.route('/api/auth/usersconnections').post((req, res, next) => {
        const userId = req.body['userId'];
        const connectedUserId = req.body['connectedUserId'];
        const token = req.query.token;
        authLogic.addConnectedUser(userId, connectedUserId, token)
            .then(response => {
                res.send(200, response);
            })
            .catch(error => next(error))
    })
}