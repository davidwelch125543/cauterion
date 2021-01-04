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

  static passwordReset(code) {
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
        <p> Your password reset code is <b style="color: blue">${code}</b></p>
        </div>
    </body>
    </html>`;
	}

	static operatorPasswordTemplate(generatedPassword) {
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
        <p> System generated a password for you as an operator: <b style="color: blue">${generatedPassword}</b></p>
        </div>
    </body>
    </html>`;
	}

	static standaloneAccountConf() {
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
				<p> Your account has been requested for activation as a standalone account. In the CAUTERION app please reset your password with this email, to activate your account.</p>
				<br>
				<p>Pentru contul creat pentru dvs. a fost solicitată migrarea către un cont de sine stătător. Vă rugăm ca în aplicația CAUTERION să solicitați resetarea parolei folosind acest email.</p>
        </div>
    </body>
    </html>`;
	}
}

module.exports = {
  HtmlForms
};