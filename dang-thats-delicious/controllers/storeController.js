exports.myMiddleware = (req, res, next) => {
  next();
}

exports.homePage = (req, res) => {
  res.render('index');
}