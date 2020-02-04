module.exports = function (firebase, fm) {
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

    return {
        login: login,
        addUser: addUser,
        addConnectedUser: addConnectedUser,
        listConnectedUsers: listConnectedUsers
    }
}