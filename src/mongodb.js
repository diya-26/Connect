const mongoose=require("mongoose")
mongoose.connect("mongodb+srv://diyakhandelwal26:diya26@f.agiff4y.mongodb.net/")
.then(()=>{
    console.log("connect")
})
.catch(()=>{
    console.log("failed")
})

const LogInSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    password: {
        type: String,
        required: true,
    },
});

const User = mongoose.model("Collection1", LogInSchema);

const personSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    age: Number,
    school: String,
    cls: Number, // New field for class
    uni: String,   // New field for university
    other: String,
    avatar: String,
    comments: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Comment',
        },
    ],
});


const Person = mongoose.model('Person', personSchema);

const commentSchema = new mongoose.Schema({
    personId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Person',
        required: true,
    },
    text: {
        type: String,
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

const Comment = mongoose.model('Comment', commentSchema);

module.exports = {
    User,
    Person,
    Comment

}; 