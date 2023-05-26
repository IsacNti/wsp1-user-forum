require('dotenv').config();
const express = require('express');
const router = express.Router();
const pool = require('../utils/database.js');
const promisePool = pool.promise();
const bcrypt = require('bcrypt');
const { post } = require('../app.js');
var validator = require('validator');
const session = require('express-session');
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


router.post('/profile', async function (req, res, next) {
    const { plats, alder , spotify } = req.body;
    const errors = [];
    if (!plats){
        errors.push("plats is required")
    }
    if (!spotify){ 
        errors.push("spotify is required")
    }
    if (plats && plats.length <= 2){
        errors.push("Title must be at least 2 characters")
    }
    if (spotify && spotify.length <= 3){
        errors.push("spotify must be at least more then 3 characters") 
    }
    if(isNaN(alder)){
        errors.push("Use numbers!")
    }
    if(errors.length > 0){
        return res.json(errors)
    }
    


    let sanitizedPlats, sanitizedSpotify;
    if (errors.length === 0) {
        // sanitize title och body, tvätta datan
        const sanitize = (str) => {
            let temp = str.trim();
            temp = validator.stripLow(temp);
            temp = validator.escape(temp);
            return temp;
        };
        if (plats) sanitizedPlats = sanitize(plats);
        if (spotify) sanitizedSpotify = sanitize(spotify);
    }
    
    author = req.session.userId;

    let user = await promisePool.query('SELECT * FROM il05users WHERE name = ?', [author]);
    
    const uId = user.insertId || user[0][0].id;

    const [rows] = await promisePool.query('INSERT INTO il05profile (uId, plats, spotify, alder) VALUES (?, ?, ?, ?)', [uId, sanitizedPlats, sanitizedSpotify, alder]);
    res.redirect('/profile');


});

router.post('/games', async function (req, res, next) {
    const {game} = req.body;
    const errors = [];
    if (!game){
        errors.push("Game is required")
    }

    if (game && game.length <= 2){
        errors.push("Game must be at least 2 characters")
    }

    if(errors.length > 0){
        return res.json(errors)
    }
    


    let sanitizedGame;
    if (errors.length === 0) {
        // sanitize title och body, tvätta datan
        const sanitize = (str) => {
            let temp = str.trim();
            temp = validator.stripLow(temp);
            temp = validator.escape(temp);
            return temp;
        };
        if (game) sanitizedGame = sanitize(game);
    }
    
    let [games] = await promisePool.query('SELECT title FROM il05games WHERE title = ?', [sanitizedGame]);

    if (games && games.length < 1) {
        games = await promisePool.query('INSERT INTO il05games (title) VALUES (?)', [sanitizedGame]);
    }
    console.log(games)
    let [gamer] = await promisePool.query('SELECT * FROM il05games WHERE title = ?', [sanitizedGame]);
    
    const uId = req.session.uId;

    console.log("gamer =" + gamer[0].id)

    const gId = gamer[0].id;

    console.log(gId);




    const [rows] = await promisePool.query('INSERT INTO il05userGame (uId, gId) VALUES (?, ?)', [uId, gId]);
    res.redirect('/profile');


});



router.get('/profile', async function (req, res, next) {
    console.log(req.session);
    console.log(req.params.uId);
    console.log(req.session.uId);

    //console.log(req.session)
    if (req.session.LoggedIn) {
        const [users] = await promisePool.query("SELECT * FROM il05users WHERE name=?", req.session.userId);
        const [rows] = await promisePool.query(`
        SELECT il05profile.*, il05users.name AS username
        FROM il05profile
        JOIN il05users ON il05profile.uId = il05users.id ORDER BY createdAt DESC LIMIT 1;`);
        const [games] = await promisePool.query(`
        Select * FROM il05userGame
        JOIN il05games ON il05userGame.gId = il05games.id
        WHERE il05userGame.uId = ? ORDER BY createdAt desc`, req.session.uId);

        console.log(games)
        console.log(rows)

        return res.render('editprofile.njk', {
            title: 'Profile',
            rows: rows,
            user: req.session.LoggedIn || 0,
            users,
            games: games,
            
        }
        );
    } 
    else {
        return res.redirect('/login')
    }
});

router.get('/publicprofile/:id', async function (req, res) {

    console.log(req.params)
    const [users] = await promisePool.query("SELECT * FROM il05users WHERE id=?", [req.params.id]);
    const [rows] = await promisePool.query(`
        SELECT il05profile.*, il05users.name AS username
        FROM il05profile
        JOIN il05users ON il05profile.uId = il05users.id
        WHERE il05profile.id = ? ORDER BY createdAt DESC LIMIT 1;`,
        [req.params.uId]
    );
    console.log(req.params.uId)
    console.log(rows)
    res.render('profile.njk', {
        rows: rows[0],
        title: 'Forum',
    });
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
                console.log(users[0].id)
                req.session.userId = sanitizedUsername;
                req.session.LoggedIn = true;
                req.session.uId = users[0].id
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
    JOIN il05users ON il05forum.authorId = il05users.id ORDER BY createdAt DESC;`);

    const [profile] = await promisePool.query(`
    SELECT il05profile.*
    FROM il05profile
    JOIN il05users ON il05profile.uId = il05users.id ORDER BY createdAt DESC LIMIT 1;`);

    res.render('lista.njk', {
        rows: rows,
        title: 'Forum',
        user: req.session.LoggedIn || 0,
        profile: profile
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
