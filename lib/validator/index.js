const Validator = require('jsonschema').Validator;
const validator = new Validator();

var feedSchema = {
    "type": "object",
    "properties": {
        "url": { "type": "string" },
        "description": { "type": "string" },
        "title": { "type": "string" }
    },
    "required": ["url", "description", "title"]
};


function validateEntry(entry) {
    return validator.validate(entry, feedSchema);
}

module.exports = {
    validateEntry
}