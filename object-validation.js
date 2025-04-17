



module.exports = function(RED) {
    const Ajv = require("ajv")
    const ajv = new Ajv({ allErrors: true, messages: true, $data: true })
    require("ajv-formats")(ajv);
    require("ajv-errors")(ajv);

    function ObjectValidation(config) {
        RED.nodes.createNode(this,config);
        this.name = config.name;
        this.data = config.data;
        this.dataType = config.dataType;
        this.constraints = config.constraints;
        let node = this;
        
        node.on('input', function(msg) {
            try {
                let data =  getValueByIndex(msg, node.data)                
                if(!data || typeof data !== 'object' || Array.isArray(data) || (data instanceof Date))
                    throw new Error(`msg.${node.data} must be a javascript object`);
                if(node.constraints && Array.isArray(node.constraints)){
                    // Eliminamos los valores de string vacio
                    data = Object.keys(data).reduce((acc, curr) => {
                        if (typeof data[curr] === 'string' && data[curr].trim() !== "") {
                            acc[curr] = data[curr];
                        }
                        return acc;
                    }, {});
                    let schema = {
                        type: "object",
                        properties: {},
                        required: [],
                        additionalProperties: true,
                        errorMessage: {required:{}}
                    };
                    schema = generateConstraints(node.constraints, schema)
                    const validate = ajv.compile(schema)
                    const valid = validate(data)
                    if(!valid){
                        msg.payload = validate.errors.map(x=> x.message)
                        node.error(validate.errors, msg);
                        return;
                    }
                } 
                node.send(msg); 
            } catch (error) {
                msg.payload = error
                node.error(error, msg);
            }
            
        });
    }
    RED.nodes.registerType("object-validation", ObjectValidation);

    function getValueByIndex(obj, index) {
        let keys = index.split('.');
        let value = obj;
        for (let key of keys) {
            if (value === undefined) {
                return "";
            }
            value = value[key];
        }
        return value;
    }
    
    function generateConstraints(constraints, schema){
        constraints.forEach(x=>{
            typeContrain(x.property, x.validator, x.value, x.typeValue,x.error, schema)
        })
        return schema
    }
    
    function typeContrain(property, validator, value, typeValue, error, schema) {
        if(!schema.properties[property]){
            schema.properties[property] = {
                errorMessage: {}
            }
        }
        switch (validator) {
            case 'required':{
                schema.required.push(property)
                schema.errorMessage.required[property] = error || `The ${property} field is required`
            }break;
            case 'type':{
                schema.properties[property].type = value
                schema.properties[property].errorMessage.type = error || `The ${property} field must be of type ${value}`
            }break;
            case 'email':{
                schema.properties[property].type = 'string'
                schema.properties[property].errorMessage.type = error || `The ${property} field must be of type string`
                schema.properties[property].format = 'email'
                schema.properties[property].errorMessage.format = error || `The ${property}  field is not a valid email address.`
            }break;
            case 'equal':{
                schema.properties[property].const = value
                schema.properties[property].errorMessage.const = error || `The ${property} field must be equal to ${value}`
            }break;
            case 'equality':{
                schema.properties[property].const = { $data: `1/${value}` }
                schema.properties[property].errorMessage.const = error || `The value of the ${property} field must be equal to the value of the ${value} field.`
            }break;
            case 'pattern':{
                schema.properties[property].pattern = value
                schema.properties[property].errorMessage.pattern = error || `The field ${property} does not match the regular expression ${value}`
            }break;
            case 'maxlength':{
                schema.properties[property].type = 'string'
                schema.properties[property].errorMessage.type = error || `The ${property} field must be of type string`
                schema.properties[property].maxLength = parseInt(value)
                schema.properties[property].errorMessage.maxLength = error || `The ${property} field must have a maximum size of ${value}`
            }break;
            case 'minlength':{
                schema.properties[property].type = 'string'
                schema.properties[property].errorMessage.type = error || `The ${property} field must be of type string`
                schema.properties[property].minLength = parseInt(value)
                schema.properties[property].errorMessage.minLength = error || `The ${property} field must have a minimum size of ${value}`
            }break;
            case 'url':{
                schema.properties[property].type = 'string'
                schema.properties[property].errorMessage.type = error || `The ${property} field must be of type string`
                schema.properties[property].format = 'uri'
                schema.properties[property].errorMessage.format = error || `The ${property} field is not a valid URL.`
            }break;
            case 'date':{
                schema.properties[property].format = 'date'
                schema.properties[property].errorMessage.format = error || `The ${property} field is not a valid date.`
            }break;
            case 'inclusion':{
                schema.properties[property].type = 'array'
                schema.properties[property].errorMessage.type = error || `The ${property} field must be of type array`                
                schema.properties[property].enum = JSON.parse(value)
                schema.properties[property].errorMessage.enum = error || `The value of the ${property} field is not included in the ${value} list.`
            }break;
            case 'exclusion':{
                schema.properties[property].type = 'array'
                schema.properties[property].errorMessage.type = error || `The ${property} field must be of type array`                   
                schema.properties[property].not = {enum:JSON.parse(value)}
                schema.properties[property].errorMessage.not = error || `The value of the field ${property} cannot be included in the list ${value}.`
            }break;
            case 'ipv4':{
                schema.properties[property].type = 'string'
                schema.properties[property].errorMessage.type = error || `The ${property} field must be of type string`
                schema.properties[property].format = 'ipv4'
                schema.properties[property].errorMessage.format = error || `The ${property} field is not a valid IPv4.`
            }break;
            case 'ipv6':{
                schema.properties[property].type = 'string'
                schema.properties[property].errorMessage.type = error || `The ${property} field must be of type string`
                schema.properties[property].format = 'ipv6'
                schema.properties[property].errorMessage.format = error || `The ${property} field is not a valid IPv6.`
            }break;
            case 'hostname':{
                schema.properties[property].type = 'string'
                schema.properties[property].errorMessage.type = error || `The ${property} field must be of type string`
                schema.properties[property].format = 'hostname'
                schema.properties[property].errorMessage.format = error || `The ${property} field is not a valid hostname.`
            }break;
            case 'json':{
                schema.properties[property].format = 'json-pointer'
                schema.properties[property].errorMessage.format = error || `The ${property} field is not a valid JSON.`
            }break;
            case 'maximum_number':{
                schema.properties[property].type = 'number'
                schema.properties[property].errorMessage.type = error || `The ${property} field must be of type number`
                schema.properties[property].maximum = parseFloat(value)
                schema.properties[property].errorMessage.maximum = error || `The value of the ${property} field cannot be greater than ${value}.`
            }break;
            case 'minimum_number':{
                schema.properties[property].type = 'number'
                schema.properties[property].errorMessage.type = error || `The ${property} field must be of type number`
                schema.properties[property].minimum = parseFloat(value)
                schema.properties[property].errorMessage.minimum = error || `The value of the ${property} field cannot be less than ${value}.`
            }break;
            case 'maximum_items':{
                schema.properties[property].type = 'array'
                schema.properties[property].errorMessage.type = error || `The ${property} field must be of type array`
                schema.properties[property].maxItems = parseFloat(value)
                schema.properties[property].errorMessage.maxItems = error || `The ${property} field cannot have more than ${value} elements..`
            }break;
            case 'minimum_items':{
                schema.properties[property].type = 'array'
                schema.properties[property].errorMessage.type = error || `The ${property} field must be of type array`
                schema.properties[property].minItems = parseFloat(value)
                schema.properties[property].errorMessage.minItems = error || `The ${property} field cannot have less than ${value} elements.`
            }break;
            case 'uuid':{
                schema.properties[property].type = 'string'
                schema.properties[property].errorMessage.type = error || `The ${property} field must be of type string`
                schema.properties[property].format = 'uuid'
                schema.properties[property].errorMessage.format = error || `The field ${property} is not a valid UUID`
            }break;
        }
    }
}




 