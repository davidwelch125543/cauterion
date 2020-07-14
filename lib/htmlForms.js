class HtmlForms {
   static confirmationCode(code) {
    return `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome</title>
        <link href="https://fonts.googleapis.com/css?family=Quicksand:300,400,500,600,700&display=swap" rel="stylesheet">
    </head>
    <body>
        <div style="background-color: #fff; width: 100%; margin: 84px auto; max-width: 800px;">
        <p> Your confirmation code is <b>${code}</b></p>
        </div>
    </body>
    </html>`;
  }
}

module.exports = {
  HtmlForms
};