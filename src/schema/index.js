var mongoose = require('mongoose');
var Schema = mongoose.Schema;

const articleSchema = new Schema({
    title: String,
    author: String,
    description: String,
    summary: String,
    link: String,
    titleTags: {
        tyoe: Array
    },
    descriptionTags: {
        type: Array
    },
    guid: String,
    date: { type: Date, default: Date.now },
    id: String
});

const teamSchema = new Schema({
    id: {
        type: String,
        unique: true
    },
    name: {
        type: String,
        unique: true
    }, 
    tags: {
        type: Array,
    }
});

const userSchema = new Schema({
    id: {
        type: String,
        unique: true
    },
    username: {
        type: String,
        unique: true
    },
    password: {
        type: String,
    }
});


articleSchema.index({ title: 1, guid: 1 }, { unique: true });
TeamSchema.index({ name: 1, id: 1 }, { unique: true });
UserSchema.index({ name: 1, id: 1 }, { unique: true });

const Article = mongoose.model('Article', articleSchema);
const User = mongoose.model('User', userSchema);
const Team = mongoose.model('Team', teamSchema);

module.exports = {
    articleSchema,
    Article,
    User,
    Team
}