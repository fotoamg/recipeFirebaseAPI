module.exports = function (firebase) {
    function login(email, password) {
        return new Promise((resolve, reject) => {
            firebase.auth()
                .signInWithEmailAndPassword(email, password)
                .then(value => {
                    firebase.auth().currentUser.getIdToken()
                        .then(
                            token => {
                                let user = firebase.auth().currentUser;
                                resolve(
                                    {
                                        uid: user.uid,
                                        email: user.email,
                                        lastname: 'Tomi',
                                        firstname: 'Muci',
                                        token: token
                                    })
                            }
                        )
                        .catch(error => reject(error))
                })
                .catch(error => reject(error))
        })
    }

    return {
        login: login
    }
}