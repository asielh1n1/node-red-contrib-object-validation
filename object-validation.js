var validate = require("validate.js");
validate.extend(validate.validators.datetime, {
    // The value is guaranteed not to be null or undefined but otherwise it
    // could be anything.
    parse: function(value, options) {
        const date = new Date(value);
        const timestamp = date.getTime();
        if (isNaN(timestamp)) {
            return NaN;
        }
        return timestamp;
    },
    // Input is a unix timestamp
    format: function(value, options) {
        const date = new Date(value);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are zero-based
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');

        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    }
});



module.exports = function(RED) {
    function ObjectValidation(config) {
        RED.nodes.createNode(this,config);
        this.name = config.name;
        this.data = config.data;
        this.dataType = config.dataType;
        this.constraints = config.constraints;
        let node = this;
        
        node.on('input', async function(msg) {
            try {
                let data =  getValueByIndex(msg, node.data)                
                if(!data || typeof data !== 'object' || Array.isArray(data) || (data instanceof Date))
                    throw new Error(`msg.${node.data} must be a javascript object`);
                if(node.constraints && Array.isArray(node.constraints)){
                    const constraints = generateConstraints(node.constraints)
                    console.log('Contrains: ', constraints);
                    let result = validate(data, constraints)
                    if(result){
                        msg.payload = result
                        return node.send([null, msg]);
                    }
                } 
                node.send([msg, null]); 
            } catch (error) {
                node.error(error);
                node.send([null, msg]);
            }
            
        });
    }
    RED.nodes.registerType("object-validation", ObjectValidation);
}


function getValueByIndex(obj, index) {
    const keys = index.split('.');
    let value = obj;
    for (let key of keys) {
        if (value === undefined) {
            return "";
        }
        value = value[key];
    }
    return value;
}

function generateConstraints(constraints){
    let result = {}
    constraints.forEach(x=>{
        result[x.property] = {}
        typeContrain(result[x.property], x.validator, x.value, x.error)
    })
    return result
}

function typeContrain(property, validator, value, error) {
    switch (validator) {
        case 'presence':{
            property['presence'] = {
                message: error || null
            }
        }break;
        case 'email':{
            property['email'] = {
                message: error || null
            }
        }break;
        case 'datetime':{
            property['datetime'] = {
                message: error || null
            }
        }break;
        case 'equality':{
            property['equality'] = {
                attribute: value,
                message: error || null
            }
        }break;
        case 'format':{
            property['format'] = {
                pattern: value,
                flags: "g",
                message: error || null
            }
        }break;
        case 'maxlength':{
            property['length'] = {
                maximum: parseInt(value),
                message: error || null
            }
        }break;
        case 'minlength':{
            property['length'] = {
                minimum: parseInt(value),
                message: error || null
            }
        }break;
        case 'type':{
            property['type'] = {
                type: value,
                message: error || null
            }
        }break;
        case 'url':{
            property['url'] = {
                message: error || null
            }
        }break;
        case 'phone':{
            property['format'] = {
                pattern: /^\(?(\d{3})\)?[-]?(\d{3})[-]?(\d{4})$/,
                flags: "g",
                message: error || 'is an invalid phone number'
            }
        }break;
        case 'credit-card':{
            property['format'] = {
                pattern: /^(?:(4[0-9]{12}(?:[0-9]{3})?)|(5[1-5][0-9]{14})|(6(?:011|5[0-9]{2})[0-9]{12})|(3[47][0-9]{13})|(3(?:0[0-5]|[68][0-9])[0-9]{11})|((?:2131|1800|35[0-9]{3})[0-9]{11}))$/,
                flags: "g",
                message: error || 'is an invalid credit card'
            }
        }break;
        case 'ipv4':{
            property['format'] = {
                pattern: /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/,
                flags: "g",
                message: error || 'is an invalid IP'
            }
        }break;
        case 'ipv6':{
            property['format'] = {
                pattern: /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$/,
                flags: "g",
                message: error || 'is an invalid IP'
            }
        }break;
        case 'inclusion':{
            property['inclusion'] = {
                within: JSON.parse(value),
                message: error || null
            }
        }break;
        case 'exclusion':{
            property['exclusion'] = {
                within: JSON.parse(value),
                message: error || null
            }
        }break;
    }
}

 