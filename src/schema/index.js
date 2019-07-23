var mongoose = require('mongoose');
var Schema = mongoose.Schema;

const articleSchema = new Schema({
    title: String,
    author: String,
    description: String,
    summary: String,
    link: String,
    guid: String,
    date: { type: Date, default: Date.now },
    id: String
});

const Article = mongoose.model('Article', articleSchema);


module.exports = {
    articleSchema,
    Article
}