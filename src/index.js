const express = require("express");
const app = express();
const path = require("path");
const hbs = require("hbs");
const multer = require('multer');
const tempelatePath = path.join(__dirname, '../tempelates');
const cookieSession = require("cookie-session");

const { User, Person, UserProfile } = require("./mongodb");

app.use(
    cookieSession({
      name: "session",
      secret: "your_secret_key_here", // Replace with a secret key for session encryption
      maxAge: 24 * 60 * 60 * 1000, // Session duration (in milliseconds)
      secure: false, // Set to true in a production environment with HTTPS
      httpOnly: true,
    })
);
app.use(express.static('css'));
app.use(express.json());
app.set("view engine", "hbs");
app.set("views", tempelatePath);
app.use(express.urlencoded({ extended: false }));

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/uploads'); // Save uploaded files to the "public/uploads" directory
    },
    filename: (req, file, cb) => {
        // Rename the file to ensure it's unique (you can use Date.now() or other strategies)
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const fileExtension = path.extname(file.originalname);
        cb(null, uniqueSuffix + fileExtension);
    }
});

const upload = multer({ storage: storage });

app.get("/", (req, res) => {
    res.render("login");
});

app.get("/signup", (req, res) => {
    res.render("signup");
});

app.post("/signup", async (req, res) => {
    const data = {
        name: req.body.name,
        password: req.body.password
    };

    try {
        // Create a new user and save it to the database
        const newUser = new User(data); // Use the User model constructor
        await newUser.save();

        // Store the user's name in the session
        req.session.name = req.body.name;

        // Redirect to the "home" page or wherever you want
        res.redirect("/home");
    } catch (error) {
        console.error(error);
        res.status(500).send("Error signing up");
    }
});

app.post("/login", async (req, res) => {
    try {
        const check = await User.findOne({ name: req.body.name }); // Use User, not user

        if (check && check.password === req.body.password) {
            // Store the user's name in the session
            req.session.name = req.body.name;

            res.redirect("/home");
        } else {
            res.send("Wrong username or password");
        }
    } catch {
        res.send("Error logging in");
    }
});

// Update the search route to populate and select the fields
app.get("/home", async (req, res) => {
    try {
        const searchQuery = req.query.name;

        if (searchQuery) {
            // Perform the search if the search query is present
            const searchResults = await Person.find({ name: { $regex: searchQuery, $options: 'i' } })
                .populate('comments') // Fetch associated comments
                .select('name age school cls uni other'); // Select the fields you want to display

            // Render the home page with search results
            res.render("search", { searchResults });
        } else {
            // Display the regular home page
            res.render("home", { step: "basic" });
        }
    } catch (error) {
        console.error(error);
        res.status(500).send("Internal Server Error");
    }
});



// Handle photo upload
app.post("/home/upload", upload.single("avatar"), async (req, res) => {
    try {
        let uploadedPhotoPath = null; // Initialize as null

        if (req.file) {
            uploadedPhotoPath = `/uploads/${req.file.filename}`; // Store the path to the uploaded photo
        }

        // Render the home page again and pass the uploaded photo path as a variable
        res.render("home", { uploadedPhoto: uploadedPhotoPath });
    } catch (error) {
        console.error(error);
        res.status(500).send("Internal Server Error");
    }
});

app.post("/home/details", upload.single("avatar"), async (req, res) => {
    try {
        // Extract form data
        const { name, age, school, cls, uni, other } = req.body;

        // Create a new Person instance with the extracted data
        const newPerson = new Person({
            name,
            age,
            school,
            cls, // Add the new "cls" field
            uni, // Add the new "uni" field
            other,
            avatar: req.file ? `/uploads/${req.file.filename}` : null
        });

        // Save the new Person instance to the database
        await newPerson.save();

        // Redirect back to the home page or wherever you want
        res.redirect("/home");
    } catch (error) {
        console.error(error);
        res.status(500).send("Internal Server Error");
    }
});


app.get("/profile", async (req, res) => {
    try {
        // Retrieve the user's name from the session
        const userName = req.session.name;

        // Render the profile page and pass the user's name
        res.render("profile", { name: userName });
    } catch (error) {
        console.error(error);
        res.status(500).send("Internal Server Error");
    }
});
app.get("/search", async (req, res) => {
    try {
        const searchQuery = req.query.name;

        if (searchQuery) {
            // Perform the search if the search query is present
            const searchResults = await Person.find({ name: { $regex: searchQuery, $options: 'i' } });
            // Render the search results page with search results
            res.render("search", { searchResults });
        } else {
            // Display a message or redirect to the home page if no search query is provided
            res.send("No search query provided.");
        }
    } catch (error) {
        console.error(error);
        res.status(500).send("Internal Server Error");
    }
});
app.post("/home/add-comment/:personId", async (req, res) => {
    try {
        const personId = req.params.personId;
        const commentText = req.body.commentText;

        // Create a new Comment instance and save it to MongoDB
        const newComment = new Comment({
            personId: personId,
            text: commentText,
        });

        await newComment.save();

        // Redirect back to the search results page
        res.redirect("/home?name="); // Add the appropriate query parameter if needed
    } catch (error) {
        console.error(error);
        res.status(500).send("Internal Server Error");
    }
});



app.listen(3069, () => {
    console.log("Server connected ");
});
