var express = require('express');
var basicAuth = require('basic-auth-connect');
var app = express();

var HTTP_PORT = 4000;

var bookmarkIndex = {};

function sendServerError(error, res) {
  console.log(error);
  res.statusCode = 500;
  res.send('server error');
}

function sendClientError(message, res) {
  console.log('bad request: ' + message);
  res.statusCode = 400;
  res.send(message);
}

function getBookmarks(req, res) {
  res.setHeader('Content-Type', 'application/json');
  res.send(JSON.stringify(bookmarkIndex));
}

function postBookmark(req, res) {
  try {
    var body = '';

    req.on('data', function (chunk) {
      body += chunk;
    });

    req.on('end', function () {
      try {
        var data = JSON.parse(body);
        if ('description' in data && 'url' in data) {
          var d = data.description, u = data.url;

          if (d in bookmarkIndex) {
            if (typeof bookmarkIndex[d] == 'string') {
              bookmarkIndex[d] = [bookmarkIndex[d], u];
            } else {
              bookmarkIndex[d].push(u);
            }
          } else {
            bookmarkIndex[d] = u;
          }
        } else {
          throw true;
        }
      } catch (e) {
        sendClientError('malformed request: ' + body, res);

        return;
      }

      getBookmarks(req, res);
    });

    req.on('error', function (error) {
      sendServerError(error, res);
    });
  } catch (e) {
    sendServerError(e, res);
  }
}

var auth = basicAuth(function (user, pass) {
  return user && user == pass.split('').reverse().join('');
});

app.get('/bookmarks', getBookmarks);
app.post('/bookmarks', auth, postBookmark);

app.listen(HTTP_PORT, function () {
    console.log('server listening on port ' + HTTP_PORT);
  });
