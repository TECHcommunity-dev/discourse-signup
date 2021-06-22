import { withPluginApi } from "discourse/lib/plugin-api";
import EmberObject, { action } from "@ember/object";
import { isEmpty } from "@ember/utils";

export default {
  name: "discourse-signup",

  initialize() {
    //Required User Fields Names and Ids (we will get Field Ids based on Field names)
    const COUNTRY_FIELD_NAME = "Country";
    let COUNTRY_FIELD_ID;
    const STATE_FIELD_NAME = "State";
    let STATE_FIELD_ID;
    const PROVINCE_FIELD_NAME = "Province";
    let PROVINCE_FIELD_ID;
    const FIRST_NAME_FIELD_NAME = "First name";
    let FIRST_NAME_FIELD_ID;
    const LAST_NAME_FIELD_NAME = "Last name";
    let LAST_NAME_FIELD_ID;
    const COMPANY_FIELD_NAME = "Company";
    let COMPANY_FIELD_ID; 
     
    
    //Required Country and Sate/Province Fields values
    const USA = "usa";
    const CANADA = "canada";
    const INTERNATIONAL = "International";
    
    let firstname, lastname;

    //Banned country list [Added by: Saurabh; Date: 21-06-2021]
    let bannedCountries = ["Afghanistan","Algeria","Angola","Armenia","Azerbaijan","Belarus","Birma/Myanmar","Burundi","Cambodia","Central African Republic","China","Congo","Cyprus","Democratic Rep. Of Congo","Egypt","Eritrea","Ethiopia","Georgia","Guinea","Guinea-Bissau","Haiti","Iraq","Israel","Jordan","Kazakhstan","Kyrgyzstan","Laos","Lebanon","Libya","Macau","Mali","Moldova","Mongolia","Mozambique","Myanmar","Nigeria","Pakistan","Russia","Russian federation","Somalia","South Sudan","Sri Lanka","Tajikistan","Tanzania","Tunisia","Turkmenistan","Uganda","Ukraine","Uzbekistan","Venezuela","Vietnam","Yemen","Zimbabwe"];
    
    withPluginApi("0.8", (api) => {
        //Modify combo-box component to add Country logic for State and Province on Create Account page [By Webdirekt on 12-11-2020]
        api.modifyClass('component:combo-box',{
            //Modified by Webdirket on 28-01-2021 (We have replaced the onChange action method by _onChange method)
            //_onChange method to hide/show State/Province User Field based on selected Country 
            _onChange(value) {
                let currentUserFieldId = this.userFieldId;
                if(currentUserFieldId){
                    let userFields = this.site.get("user_fields");
                    let countryField = userFields.find(obj => obj.name.toLowerCase() == ("Country").toLowerCase());
                    //If Current user fields is Country
                    if(currentUserFieldId == countryField.id){
                        /**
                        * Banned Country logic [Added by: Saurabh; Date: 21-06-2021]
                        **/
                        //If selected Country is a banned country then make Company field mandatory
                        if(value){
                          //If the selected Country is a banned country then set the asterisk sign for the Company field.
                          if(bannedCountries.find(country => country.toLowerCase() == value.toLowerCase())){
                            document.querySelector('label[for="new-account-company"]').setAttribute('data-value', '*');
                          }
                          else{ //Remove the asterisk sign for the Company field if select Country is not banned
                            document.querySelector('label[for="new-account-company"]').setAttribute('data-value', '');
                          }
                        }
                        else{ //Remove the asterisk sign for the Company field is un-selected
                            document.querySelector('label[for="new-account-company"]').setAttribute('data-value', '');
                         }
                      
                        //If Country is USA, then show State dropdown and hide Province dropdown
                        if(value){
                            if(value.toLowerCase() == USA){
                                if(document.querySelector(".input-group.create-account-state") && document.querySelector(".input-group.create-account-province")){
                                  document.querySelector(".input-group.create-account-state").style.display = "block";
                                  document.querySelector(".input-group.create-account-province").style.display = "none"; 
                                }
                                document.querySelector(".user-field-state").style.display = "block";
                                document.querySelector(".user-field-province").style.display = "none";
                            }
                            //If Country is Canada, then show Province dropdown and hide State dropdown
                            else if(value.toLowerCase() == CANADA){
                                if(document.querySelector(".input-group.create-account-state") && document.querySelector(".input-group.create-account-province")){
                                  document.querySelector(".input-group.create-account-state").style.display = "none";
                                  document.querySelector(".input-group.create-account-province").style.display = "block";
                                }
                                document.querySelector(".user-field-state").style.display = "none";
                                document.querySelector(".user-field-province").style.display = "block";
                            }
                            //If Country is not USA or Canada , then hide State and Province dropdowns
                            else{
                                if(document.querySelector(".input-group.create-account-state") && document.querySelector(".input-group.create-account-province")){
                                  document.querySelector(".input-group.create-account-state").style.display = "none";
                                  document.querySelector(".input-group.create-account-province").style.display = "none";
                                }
                                document.querySelector(".user-field-state").style.display = "none";
                                document.querySelector(".user-field-province").style.display = "none";
                            }   
                        }
                        //If Country is Null , then hide State and Province dropdowns
                        else{
                            if(document.querySelector(".input-group.create-account-state") && document.querySelector(".input-group.create-account-province")){
                              document.querySelector(".input-group.create-account-state").style.display = "none";                            
                              document.querySelector(".input-group.create-account-province").style.display = "none";
                            }
                            document.querySelector(".user-field-state").style.display = "none";
                            document.querySelector(".user-field-province").style.display = "none";
                        }
                    }
                }
                return true;
            },

        });

        //Modify create-account controller to add Country logic for State and Province on Create Account page [By Webdirekt on 12-11-2020]
        //Modify create-account controller to customize UI of Create User Form [18-11-2020].
        api.modifyClass('controller:create-account',{
            firstNameField : null,
            lastNameField : null,
            companyField: null,
            countryField : null,
            stateField : null,
            provinceField : null,
            wdUserFields: null,
            //Added below method by Webdirket on 12-11-2020
            setValueForStateProvince(field_id, value){
                for (var i in this.userFields) {
                if ((this.userFields[i]).field.id == field_id) {
                    (this.userFields[i]).set("value", value);
                    break; //Stop this loop, we found it!
                }
                }
            },
            //Added below method by Webdirket on 12-11-2020
            processStateProvinceUserFields(processState){
                let value;
                
                if(processState == "pre"){ //Setting State/Province value before Checking Validation
                    value = INTERNATIONAL;
                }
                else{ //Reseting State/Province value if Validation fails
                    value = null;
                }
                let userFields = this.userFields;
                if (userFields) {
                userFields = userFields.filterBy("field.required");
                }
                if (!isEmpty(userFields)) {
                    //Loop over required user fields
                userFields.find((uf) => {
                    const field_id = uf.field.id;
                    //If current User Field is Country then set Sate/Provice based on selected Country
                    if(field_id && field_id == COUNTRY_FIELD_ID){
                        const val = uf.get("value");
                        if(val){
                            //If Selected Country is USA, set Province as "International" 
                            if(val.toLowerCase() == USA){
                                this.setValueForStateProvince(PROVINCE_FIELD_ID, value);
                            }
                            //If Selected Country is Canada, set State as "International"
                            else if(val.toLowerCase() == CANADA){
                                this.setValueForStateProvince(STATE_FIELD_ID, value);
                            }
                            //If Selected Country is other than USA and Canada, set both State and Province as "International"
                            else{
                                this.setValueForStateProvince(PROVINCE_FIELD_ID, value);
                                this.setValueForStateProvince(STATE_FIELD_ID, value);
                            }   
                        }
                        //If Selected Country is Null, Reset both State and Province
                        else{
                            this.setValueForStateProvince(PROVINCE_FIELD_ID, value);
                            this.setValueForStateProvince(STATE_FIELD_ID, value);
                        } 
                    }
                        //Getting Users first and Last name to Generate Users Full name while creating User
                        if(field_id && field_id == FIRST_NAME_FIELD_ID){
                            firstname = uf.get("value");    
                        }
                        if(field_id && field_id == LAST_NAME_FIELD_ID){
                            lastname = uf.get("value");    
                        } 
                });
                    //Setting User Full Name [First Name + Last Name ]
                    if(firstname && lastname){
                        this.set('accountName', firstname + " " + lastname);       
                    } 
                }
            },
            //Method to Validate First name and Last name
            firstAndLastNameValidation(){
                const firstNameField = this.get("firstNameField");
                const lastNameField = this.get("lastNameField");
                //Validate First name
                if(firstNameField){ 
                    const val = firstNameField.get("value");
                    if(!val || isEmpty(val.trim())){
                    return EmberObject.create({
                        failed: true,
                        message: I18n.t("user_fields.required", { name: firstNameField.field.name }),
                        element: document.querySelector("#new-account-firstname"),
                        });
                    }
                }
                //Validate Last name
                if(lastNameField){
                    const val = lastNameField.get("value");
                    if(!val || isEmpty(val.trim())){
                    return EmberObject.create({
                        failed: true,
                        message: I18n.t("user_fields.required", { name: lastNameField.field.name }),
                        element: document.querySelector("#new-account-lastname"),
                        });
                    }
                }
                return EmberObject.create({ ok: true });
            },
            //Method to Validate Company Field [Added by: Saurabh; Date:22/06/2021]
            //If User Selects banned country then Company should be provided.
            companyValidation(){
              const companyField = this.get("companyField");
              const countryField = this.get("countryField");
              //If countryField is not null
              if(countryField){ 
                const countryValue = countryField.get("value");
                //If country is selected
                if(countryValue){
                  //If the selected country is banned country
                  if(bannedCountries.find(country => country.toLowerCase() == countryValue.toLowerCase())){
                    const companyValue = companyField.get("value");
                    //If Company is not provided then return an error message for Company field
                    if(!companyValue || isEmpty(companyValue.trim())){
                       return EmberObject.create({
                            failed: true,
                            message: I18n.t("user_fields.required", { name: companyField.field.name }),
                            element: document.querySelector("#new-account-company"),
                       });
                    }
                  }  
                }
              }
              return EmberObject.create({ ok: true });
            },
            onShow() {
              //Called super class onShow action to grab the changes in discourse core. [09-04-2021]
              this._super(...arguments);

              //Setting required User Fields variables before showing create account form.
              if(this.userFields){
                  let firstNameFiled = this.userFields.find(obj => obj.field.name == FIRST_NAME_FIELD_NAME);
                  FIRST_NAME_FIELD_ID = firstNameFiled.field.id;
                  let lastNameField = this.userFields.find(obj => obj.field.name == LAST_NAME_FIELD_NAME);
                  LAST_NAME_FIELD_ID = lastNameField.field.id;
                  let countryField = this.userFields.find(obj => obj.field.name == COUNTRY_FIELD_NAME);
                  COUNTRY_FIELD_ID = countryField.field.id;
                  let stateField = this.userFields.find(obj => obj.field.name == STATE_FIELD_NAME);
                  STATE_FIELD_ID = stateField.field.id;
                  let provinceField = this.userFields.find(obj => obj.field.name == PROVINCE_FIELD_NAME);
                  PROVINCE_FIELD_ID = provinceField.field.id;
                  let companyField = this.userFields.find(obj => obj.field.name == COMPANY_FIELD_NAME);
                  COMPANY_FIELD_ID = companyField.field.id;

                  this.set("firstNameField", firstNameFiled);
                  this.set("lastNameField", lastNameField);
                  this.set("countryField", countryField);
                  this.set("stateField", stateField);
                  this.set("provinceField", provinceField);
                  this.set("companyField", companyField);
              }
            },
            actions:{
                createAccount() {
                    this.clearFlash();
                    //Added by Webdirekt on 12-11-2020
                    //Set the value for State or Province based on Seleted Country.
                    this.processStateProvinceUserFields("pre");
                  
                    const validation = [
                    this.emailValidation,
                    this.usernameValidation,
                    this.nameValidation,
                    this.firstAndLastNameValidation(),//Validating FirstName and Last Name before Password [by Webdirekt on 19-11-2020]
                    this.passwordValidation,
                    this.companyValidation(), //Validating Company after Password [Added by: Saurabh; Date: 22/06/2021]
                    this.userFieldsValidation,
                    ].find((v) => v.failed);
            
                    if (validation) {
                        //Added by Webdirekt on 12-11-2020
                        //Reset State/Province User Field based on Selected Country if any validation Error occurred.
                        this.processStateProvinceUserFields("post");
                        
                    if (validation.message) {
                        this.flash(validation.message, "error");
                    }
            
                    const element = validation.element;
                    if (element.tagName === "DIV") {
                        if (element.scrollIntoView) {
                        element.scrollIntoView();
                        }
                        element.click();
                    } else {
                        element.focus();
                    }
            
                      return;
                    }
                    //Called super class createAccount action to grab the changes in discourse core. [09-04-2021]
                    this._super(...arguments);
                },
                //Override the checkEmailAvailability to auto-fill the Username Field based on the email [Date: 23-04-2021].
                checkEmailAvailability() { 
                    //Called super class checkEmailAvailability action to grab the changes in discourse core.
                    let result = this._super(...arguments); //Here Super metdods check wheteher email is already exist or not and update the properties (serverAccountEmail and serverEmailValidation) based on result.
                    if(result){
                        result.then((value) => {
                            //As super method executes completely then check Null for serverAccountEmail and serverEmailValidation properties
                            if(this.serverAccountEmail && this.serverEmailValidation){
                                //If Email validation is OK
                                if(this.serverEmailValidation.ok){
                                    //Set the Username fields to the string before '@' of the specified email.
                                    this.set("accountUsername",this.serverAccountEmail.substring(0, this.serverAccountEmail.indexOf('@')));
                                }
                                else{
                                    //do nothing...
                                }
                            }
                        });
                    }
                    else{ //If supper methdos returns null 
                        //if email vaidation is not OK or serverAccountEmail is not equal to accountEmail then reset the username field
                        if(!this.emailValidation.ok){
                            this.set("accountUsername","");
                        }
                    }
                }
            }
        });
    });
  },
};
