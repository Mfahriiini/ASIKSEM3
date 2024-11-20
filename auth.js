const express = require('express');
const bcrypt = require('bcrypt');
const router = express.Router();
const db = require('./db');

// Middleware untuk memeriksa login
const checkAuth = (req, res, next) => {
    if (req.session && req.session.user) {
        next(); // Jika sudah login, lanjutkan ke rute berikutnya
    } else {
        res.redirect('/login'); // Jika belum login, arahkan ke halaman login
    }
};

// Rute untuk login
router.post('/login', (req, res) => {
    const { email, password } = req.body;

    db.query('SELECT * FROM users WHERE email = ?', [email], async (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Error during login');
        }

        if (results.length === 0 || !(await bcrypt.compare(password, results[0].password))) {
            return res.send('Invalid email or password');
        }

        // Simpan user ke session
        req.session.user = {
            id: results[0].id,
            name: results[0].name,
            email: results[0].email
        };

        res.redirect('/home');
    });
});

// rute membaca home
router.get('/home',(req, res) => {
    res.render('home', { user: req.session.user }); // Kirim user ke template
});


// rute membaca registrasi
router.get('/register', (req, res) => res.render('register'));

// rute proses registrasi
router.post('/register', async (req, res) => {
    const { name, email, nim, major, birth_place_date, address, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    db.query(
        'INSERT INTO users (name, email, nim, major, birth_place_date, address, password) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [name, email, nim, major, birth_place_date, address, hashedPassword],
        (err) => {
            if (err) {
                console.error(err);
                return res.status(500).send('Error registering user');
            }
            res.redirect('/login');
        }
    );
});

// rute membaca users berdasarkan id
router.get('/users/:id', (req, res) => {
    const id = req.params.id;

    db.query('SELECT * FROM users WHERE id = ?', [id], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Error fetching user');
        }
        res.json(results[0]);
    });
});

// rute membaca update users berdasakan id
router.post('/users/update/:id', (req, res) => {
    const { name, email, nim, major, birth_place_date, address, password } = req.body;
    const id = req.params.id;

    bcrypt.hash(password, 10, (err, hashedPassword) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Error updating user');
        }

        db.query(
            'UPDATE users SET name = ?, email = ?, nim = ?, major = ?, birth_place_date = ?, address = ?, password = ? WHERE id = ?',
            [name, email, nim, major, birth_place_date, address, hashedPassword, id],
            (err) => {
                if (err) {
                    console.error(err);
                    return res.status(500).send('Error updating user');
                }
                res.redirect('/profile');
            }
        );
    });
});

// rute proses menghapus users  berdasarkan id
router.post('/users/delete/:id', (req, res) => {
    const id = req.params.id;

    db.query('DELETE FROM users WHERE id = ?', [id], (err) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Error deleting user');
        }
        res.redirect('/login');
    });
});

router.get('/login', (req, res) => res.render('login'));

// Rute untuk login
router.post('/login', (req, res) => {
    const { email, password } = req.body;

    db.query('SELECT * FROM users WHERE email = ?', [email], async (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Error during login');
        }

        if (results.length === 0 || !(await bcrypt.compare(password, results[0].password))) {
            return res.send('Invalid email or password');
        }

        // Simpan user ke session
        req.session.user = {
            id: results[0].id,
            name: results[0].name,
            email: results[0].email
        };

        res.redirect('/home');
    });
});

// // rute untuk membaca home
// router.get('/home', (req, res) => {
//     if (req.session.user) {
//         res.render('home', { user: req.session.user }); // Kirim user ke template
//     } else {
//         res.redirect('/login');
//     }
// });

// rute membaca profile
router.get('/profile', checkAuth, (req, res) => {
    const userId = req.session.user.id; // Ambil ID user dari session

    
            res.render('profile', {
                user: req.session.user,
              
            });
        });
   

//rute membaca logout 
router.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Error logging out');
        }
        res.redirect('/login');
    });
});

// rute membaca locate
router.get('/locate', (req, res) => {
    res.render('locate', { user: req.session.user });
});

// rute membaca mangrove
router.get('/mangrove', (req, res) => {
            db.query("SELECT * FROM mangroves", (err, mangroves)=>{
                if (err) throw err;

            res.render('mangrove', {
                user: req.session.user,
                mangroves: mangroves
            });
        });
});

// rute proses menambahkan mangrove
router.post('/add-mangrove', checkAuth, (req, res) => {
    const { nama_tempat, luasan, lokasi, longi, kondisi_status, lat } = req.body;

    db.query(
        'INSERT INTO mangroves (nama_tempat, luasan, lokasi, longi, kondisi_status, lat) VALUES (?, ?, ?, ?, ?, ?)',
        [nama_tempat, luasan, lokasi, longi, kondisi_status, lat],
        (err) => {
            if (err) {
                console.error(err);
                return res.status(500).send('Error adding mangrove');
            }
            res.redirect('/mangrove');
        }
    );
});

// rute proses menghapus mangrove
router.get("/edit-mangrove/:id", (req, res) => {
    const id = req.params.id; // Gunakan req.params.id
    db.query("SELECT * FROM mangroves WHERE id = ?", [id], (err, mangrove) => {
        if (err) throw err;

        // Pastikan hanya mengirimkan satu data karena ID unik
        res.render('edit_mangrove', {
            mangrove: mangrove[0] // Kirim data tunggal, bukan array
        });
    });
});

// rute proses mengedit mangrove
router.post('/edit-mangrove/:id', checkAuth, (req, res) => {
    const id = req.params.id; // Gunakan req.params.id untuk mendapatkan ID dari URL
    const { nama_tempat, luasan, lokasi, longi, kondisi_status, lat} = req.body;

    db.query(
        'UPDATE mangroves SET nama_tempat = ?, luasan = ?, lokasi = ?, longi = ?, kondisi_status = ?, lat = ? WHERE id = ?',
        [nama_tempat, luasan, lokasi, longi, kondisi_status, lat, id], // Perbaiki urutan parameter
        (err) => {
            if (err) {
                console.error(err);
                return res.status(500).send('Error updating mangrove');
            }
            res.redirect('/mangrove');
        }
    );
});

// rute proses menghapus mangrove
router.post('/hapus-mangrove/:id', checkAuth, (req, res) => {
    const mangroves = req.params.id;

    db.query('DELETE FROM mangroves WHERE id = ?', [mangroves], (err) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Error deleting coral');
        }
        res.redirect('/mangrove');
    });
});



// rute membaca bluecarbon
router.get('/bluecarbon', (req, res) => {
    res.render('bluecarbon', {
        user: req.session.user
    });
});

// rute membaca about
router.get('/about', (req, res) => {
    res.render('about', {
        user: req.session.user
    });
});

// rute peta
router.get('/petasatu', (req, res) => {
    res.render('petasatu', {
        user: req.session.user
    });
});

// rute peta dua
router.get('/petaduaini', (req, res) => {
    res.render('petaduaini', {
        user: req.session.user
    });
});


// rute peta tiga
router.get('/petatiga', (req, res) => {
    res.render('petatiga', {
        user: req.session.user
    });
});


module.exports = router;

