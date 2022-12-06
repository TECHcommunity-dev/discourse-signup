import { withPluginApi } from "discourse/lib/plugin-api";
import EmberObject, { action } from "@ember/object";
import { isEmpty } from "@ember/utils";
import { alias, notEmpty, or, readOnly } from "@ember/object/computed";
import discourseComputed from "discourse-common/utils/decorators";
import { observes } from "discourse-common/utils/decorators";

export default {
  name: "techcommunity-invites-user-signup",

  initialize() {
    withPluginApi("0.8", (api) => {
        //Modify invites-show controller to customize UI add Country logic for State and Province on invites User signup page [Date: 06/05/2021]
        api.modifyClass('controller:invites-show',{
            pluginId : 'techcommunity-invites-show',
            firstNameField : null,
            lastNameField : null,
            companyField: null,
            countryField : null,
            stateField : null,
            provinceField : null,
            //Method to set the value for State/ Province based on selected Country. 
            setValueForStateProvince(field_id, value){
                for (var i in this.userFields) {
                  if ((this.userFields[i]).field.id == field_id) {
                      (this.userFields[i]).set("value", value);
                      break; //Stop this loop, we found it!
                  }
                }
            },
            //Method decides what value (International or null) to be set for State/Province user-field value based on selected Country
            processStateProvinceUserFields(processState){
                //Required Country and Sate/Province Fields values
                const USA = "usa";
                const CANADA = "canada";
                const INTERNATIONAL = "International";

                let firstname, lastname;
                let value;
                
                if(processState == "pre"){ //Setting State/Province value before Checking Validation
                    value = INTERNATIONAL;
                }
                else{ //Reseting State/Province value if Validation fails
                    value = null;
                }
                let userFields = this.userFields;
                //Required User Fields Names and Ids (we will get Field Ids based on Field names)
                let countryFieldObj = userFields.find(obj => obj.field.name.toLowerCase() == ("Country").toLowerCase());
                let stateFieldObj = userFields.find(obj => obj.field.name.toLowerCase() == ("State").toLowerCase());
                let provinceFieldObj = userFields.find(obj => obj.field.name.toLowerCase() == ("Province").toLowerCase());
                let firstnameFieldObj = userFields.find(obj => obj.field.name.toLowerCase() == ("First name").toLowerCase());
                let lastnameFieldObj = userFields.find(obj => obj.field.name.toLowerCase() == ("Last name").toLowerCase());
                let companyFieldObj = userFields.find(obj => obj.field.name.toLowerCase() == ("Company").toLowerCase());  
              
                if (userFields) {
                userFields = userFields.filterBy("field.required");
                }
                if (!isEmpty(userFields)) {
                    //Loop over required user fields
                userFields.find((uf) => {
                    const field_id = uf.field.id;
                    //If current User Field is Country then set Sate/Provice based on selected Country
                    if(field_id && field_id == countryFieldObj.field.id){
                        const val = uf.get("value");
                        if(val){
                            //If Selected Country is USA, set Province as "International" 
                            if(val.toLowerCase() == USA){
                                this.setValueForStateProvince(provinceFieldObj.field.id, value);
                                if(stateFieldObj.value == INTERNATIONAL){
                                  this.setValueForStateProvince(stateFieldObj.field.id, null);  
                                }
                            }
                            //If Selected Country is Canada, set State as "International"
                            else if(val.toLowerCase() == CANADA){
                                this.setValueForStateProvince(stateFieldObj.field.id, value);
                                if(provinceFieldObj.value == INTERNATIONAL){
                                  this.setValueForStateProvince(provinceFieldObj.field.id, null);  
                                }
                            }
                            //If Selected Country is other than USA and Canada, set both State and Province as "International"
                            else{
                                this.setValueForStateProvince(provinceFieldObj.field.id, value);
                                this.setValueForStateProvince(stateFieldObj.field.id, value);
                            }   
                        }
                        //If Selected Country is Null, Reset both State and Province
                        else{
                             value = null;
                            this.setValueForStateProvince(provinceFieldObj.field.id, value);
                            this.setValueForStateProvince(stateFieldObj.field.id, value);
                        } 
                    }
                        //Getting Users first and Last name to Generate Users Full name while creating User
                        if(field_id && field_id == firstnameFieldObj.field.id){
                            firstname = uf.get("value");    
                        }
                        if(field_id && field_id == lastnameFieldObj.field.id){
                            lastname = uf.get("value");    
                        } 
                });
                    //Setting User Full Name [First Name + Last Name ]
                    if(firstname && lastname){
                        this.set('accountName', firstname + " " + lastname);       
                    } 
                }
            },
           //Autofill Username field on out-focus of the email field is provided email is valid. [Date: 07/05/2021]
           @observes("email")
           autoFillUsername(email){
              let invitesController = this;
              window.onload = function() {
                let emailField = document.querySelector(".invites-show #new-account-email");
                if(emailField){
                  emailField.addEventListener("focusout", function(){
                      if(invitesController.emailValidation && invitesController.emailValidation.ok){
                        let usernameField = document.querySelector(".invites-show #new-account-username");
                        if(usernameField && invitesController.email){
                          invitesController.set('accountUsername', invitesController.email.substring(0, invitesController.email.indexOf('@')));
                        }
                      }
                  });
                }
              };
            },
            //Auto-set State/Province field based on the selected country. This function will trigger whenever any of the user fields value is changed. [Date: 07/05/2021]
           @observes("userFields.@each.value")
            updateUserFieldsDynamically() {
                this.processStateProvinceUserFields("pre");
            },                 
        });
    });
  },
};
