module.exports = function (databaseUrl) {
    
    function get(path, token) {
        return new Promise((resolve, reject) => {
            const req = makeRequest("GET", path, token, resolve, reject);
            req.end();
        })
    }

    function post(path, obj, token) {
        return new Promise((resolve, reject) => {
            const req = makeRequest("POST", path, token, resolve, reject);
            const postData = JSON.stringify(obj);
            req.write(postData);
            req.end();
        })
    }

    function put(path, obj, token) {
        return new Promise((resolve, reject) => {
            const req = makeRequest("PUT", path, token, resolve, reject);
            const postData = JSON.stringify(obj);
            req.write(postData);
            req.end();
        })
    }

    function del(path, obj, token) {
        console.log(databaseUrl)
        return new Promise((resolve, reject) => {
            const req = makeRequest("DELETE", path, token, resolve, reject);
            const postData = JSON.stringify(obj);
            req.write(postData);
            req.end();
        })
    }

    function makeRequest(method, path, token, resolveFunc, rejectFunc) {
        let tokenString = '';
        if (token && token.length > 0) {
            tokenString = `?auth=${token}`;
        }

        if (path[0] !== '/') {
            path = '/' + path;
        }
        const options = {
            host: databaseUrl,
            port: 443,
            path: `${path}.json${tokenString}`,
            method: method,
            headers: {
                "Content-Type": "application/json",
                //'Content-Length': postData.length,
                //"Authorization": token
            }
        };
        const https = require('https');
        const req = https.request(options, function (res) {
            if (res.statusCode === 401) {
                rejectFunc({
                    statusCode: 401,
                    message: "Permission Denied!"
                });
            } else if (res.statusCode !== 200) {
                rejectFunc({
                    statusCode: res.statusCode,
                    message: res.statusMessage
                });
            }
            else {
                const responseString = "";

                res.on("data", function (data) {
                    responseString += data;
                });
                res.on("end", function () {
                    let data = JSON.parse(responseString)
                    resolveFunc(data);
                });
            }
        });
        req.on('error', (e) => {
            rejectFunc(e);
        });
        return req;
    }



    return {
        get: get,
        post: post,
        put: put,
        del: del
    }
}