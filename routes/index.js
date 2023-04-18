require('dotenv').config();
const express = require('express');
const router = express.Router();
const pool = require('../utils/database.js');
const promisePool = pool.promise();
const bcrypt = require('bcrypt');
const { post } = require('../app.js');
var validator = require('validator')
//const session = require('express-session');


/* GET home page. */
router.get('/', function (req, res, next) {
    res.render('index.njk', {
        title: 'Login ALC', user: req.session.LoggedIn || 0
    });
});

router.get('/login', function (req, res, next) {
    if(!req.session.LoggedIn){
    return res.render('form.njk', { title: 'Login ALC', user: req.session.LoggedIn || 0 });
    }

});

router.get('/profile', async function (req, res, next) {
    //console.log(req.session)

    //const [users] = await promisePool.query("SELECT * FROM unusers WHERE id=?", req.session.userId);
    //console.log(req.session)
    if (req.session.LoggedIn) {
        return res.render('profile.njk', {
            title: 'Profile',
            user: req.session.LoggedIn || 0
        }
        );
    } else {

        return res.redirect('/login')
    }



});

router.post('/login', async function (req, res, next) {
    const { username, password } = req.body;
    const errors = [];
    console.log('test');

    if (username === "") {
        console.log("Username is Required")
        errors.push("Username is Required")
        return res.json(errors)
    } else if (password === "") {
        console.log("Password is Required")
        errors.push("Password is Required")
        return res.json(errors)
    }
    let sanitizedUsername;
    if (errors.length === 0) {
        // sanitize title och body, tvätta datan
        const sanitize = (str) => {
            let temp = str.trim();
            temp = validator.stripLow(temp);
            temp = validator.escape(temp);
            return temp;
        };
        if (username) sanitizedUsername = sanitize(username);
    }

    const [users] = await promisePool.query("SELECT * FROM il05users WHERE name=?", sanitizedUsername);
    //console.log(users)
    if (users.length > 0) {

        bcrypt.compare(password, users[0].password, function (err, result) {
            // result == true logga in, annars buuuu 
            if (result) {
                //console.log(users[0].id)
                req.session.userId = username;
                req.session.LoggedIn = true;
                return res.redirect('/profile');
            } else {
                errors.push("Invalid username or password")
                return res.json(errors)
            }
        });
    } else {
        errors.push("Wrong credentials")
        return res.json(errors)
    }
    // if username inte är i db : login fail!
});

router.post('/delete', async function (req, res, next) {
    if (req.session.LoggedIn) {
        req.session.LoggedIn = false;
        await promisePool.query('DELETE FROM il05users WHERE name=?', req.session.userId);
        res.redirect('/');
    } else {
        return res.status(401).send("Access denied");
    }
});

router.get('/logout', function (req, res, next) {
    req.session.LoggedIn = false;
    res.render('logout.njk', { title: 'logout ALC', user: req.session.LoggedIn || 0 });
});

router.post('/logout', async function (req, res, next) {
    console.log(req.session.LoggedIn);
    if (req.session.LoggedIn) {
        req.session.LoggedIn = false;
        res.redirect('/');
        
    } else {
        return res.status(401).send("Access denied");
    }
});

router.get('/register', async function (req, res) {
    if(!req.session.LoggedIn) {
    return res.render('register.njk', { title: 'Register', user: req.session.LoggedIn || 0 })
    }
    res.redirect('/profile')
});

router.post('/register', async function (req, res) {
    const { username, password, passwordConfirmation } = req.body;
    const errors = [];

    if (username === "") {
        console.log("Username is Required")
        errors.push("Username is Required")
        return res.json(errors)
    } else if (password === "") {
        console.log("Password is Required")
        errors.push("Password is Required")
        return res.json(errors)
    } else if (password !== passwordConfirmation) {
        console.log("Passwords do not match")
        errors.push("Passwords do not match")
        return res.json(errors)
    }
    let sanitizedUsername;
    if (errors.length === 0) {
        // sanitize title och body, tvätta datan
        const sanitize = (str) => {
            let temp = str.trim();
            temp = validator.stripLow(temp);
            temp = validator.escape(temp);
            return temp;
        };
        if (username) sanitizedUsername = sanitize(username);
    }

    const [users] = await promisePool.query("SELECT * FROM il05users WHERE name=?", sanitizedUsername);
    //console.log(users)

    if (users.length > 0) {
        console.log("Username is already taken")
        errors.push("Username is already taken")
        return res.json(errors)
    }

    await bcrypt.hash(password, 10, async function (err, hash) {

        console.log(hash);
        const [rows] = await promisePool.query('INSERT INTO il05users (name, password) VALUES (?, ?)', [sanitizedUsername, hash])
        res.redirect('/login');

    });



});

router.get('/crypt/:pwd', async function (req, res, next) {
    const pwd = req.params.pwd;

    await bcrypt.hash(pwd, 10, function (err, hash) {

        console.log(hash);
        //return res.json(hash);
        return res.json({ hash });
    });

});



router.get('/new', async function (req, res, next) {
    if(req.session.LoggedIn){
    const [users] = await promisePool.query("SELECT * FROM il05users WHERE name=?", req.session.userId);
        return res.render('new.njk', {
            title: 'Nytt inlägg',
            users,
            user: req.session.userId || 0
        });
    }
    /*
    för att kunna gå in i new utan att behöva vara inloggad

    const [users] = await promisePool.query("SELECT * FROM il05users");
    res.render('new.njk', {
        title: 'Nytt inlägg',
        //users,
    });
    */
   res.redirect('/login')
});

router.post('/new', async function (req, res, next) {
    const { author, title, content } = req.body;
    const errors = [];
    if (!title){
        errors.push("Title is required")
    }
    if (!content){ 
        errors.push("Content is required")
    }
    if (title && title.length <= 3){
        errors.push("Title must be at least 3 characters")
    }
    if (content && content.length <= 10){
        errors.push("Content must be at least 10 characters") 
    }
    if(errors.length > 0){
        return res.json(errors)
    }


    let sanitizedTitle, sanitizedContent;
    if (errors.length === 0) {
        // sanitize title och body, tvätta datan
        const sanitize = (str) => {
            let temp = str.trim();
            temp = validator.stripLow(temp);
            temp = validator.escape(temp);
            return temp;
        };
        if (title) sanitizedTitle = sanitize(title);
        if (content) sanitizedContent = sanitize(content);
    }

    
    
    let user = await promisePool.query('SELECT * FROM il05users WHERE name = ?', [author]);
    
    const userId = user.insertId || user[0][0].id;
    const [rows] = await promisePool.query('INSERT INTO il05forum (authorId, title, content) VALUES (?, ?, ?)', [userId, sanitizedTitle, sanitizedContent]);
    res.redirect('/');


});
/*
let user = await promisePool.query('SELECT * FROM il05users WHERE name = ?', [author]);
if (!user) {
    user = await promisePool.query('INSERT INTO il05users (name) VALUES (?)', [author]);
}

const userId = user.insertId || user[0][0].id;
const [rows] = await promisePool.query('INSERT INTO il05forum (authorId, title, content) VALUES (?, ?, ?)', [userId, title, content]);
res.redirect('/'); // den här raden kan vara bra att kommentera ut för felsökning, du kan då använda tex. res.json({rows}) för att se vad som skickas tillbaka från databasen
});

*/

// index slut

//postlista

router.get('/postlista', async function (req, res, next) {
    const [rows] = await promisePool.query(`
    SELECT il05forum.*, il05users.name AS username
    FROM il05forum
    JOIN il05users ON il05forum.authorId = il05users.id;`);
    res.render('lista.njk', {
        rows: rows,
        title: 'Forum',
        user: req.session.LoggedIn || 0
    });
});


router.get('/post/:id', async function (req, res) {

    console.log(req.params)
    const [rows] = await promisePool.query(
        `SELECT il05forum.*, il05users.name AS username
        FROM il05forum
        JOIN il05users ON il05forum.authorId = il05users.id
        WHERE il05forum.id = ?;`,
        [req.params.id]
    );
    console.log(rows)
    res.render('post.njk', {
        post: rows[0],
        title: 'Forum',
    });
});



module.exports = router;
