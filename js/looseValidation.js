/*jslint evil: false, jquery:true, forin: true, white: false, devel:true */
/*!
 * Loose Mega Drop Down plugin
 * Author: ryanand26 (2012) (http://www.looseideas.co.uk)
 * @version 1.0
**/

(function (window, $, undefined) {
	"use strict";

	window.looseValidation = (function (validation) {
		var totalInvalid = 0,
			eServerErrorBlock,

			defaults = {
				sValidationSelect : '.looseValidation', //dialogs use a data attribute, not a class, but these are passed in target params
				sValidationFailed : 'error',
				sValidationPassed : 'valid',
				sValidationPassedMessage : 'successMessage',
				sValidationAttr : 'data-validation',
				sSuccessAttr : 'data-success',
				sServerErrorBlockSelect : '.errorBlock',
				defaultErrorText : 'Whoops'
			};
	
		/**
		* Init
		*/
		validation.init = function (eTargetParam) {
			var validatorInstance = this.createValidator(eTargetParam);

			eTargetParam.data('validator', validatorInstance);

			return this;
		};

		/**
		* Creates and returns a new validator object
		*/
		validation.createValidator = function (eTargetParam, options) {
			//set the settings object
			var settings = $.extend({}, defaults, options),
				eTarget = eTargetParam || $(settings.sValidationSelect);

			if (eTarget.length > 0) {
				return new Validator(eTarget, settings);
			}
			else {
				return false;
			}
		};

		/**
		* Set a validation rule
		*/
		validation.addValidationFunction = function (sName, fRule) {
			var bIsAdded = addFunctionToFunctionSet(sName, fRule, validationRules);

			return this;
		};

		/**
		* Set a success function
		*/
		validation.addSuccessFunction = function (sName, fRule) {
			var bIsAdded = addFunctionToFunctionSet(sName, fRule, successFunctions);
			
			return this;
		};

		/**
		* Function to check then add a rule
		*/
		var addFunctionToFunctionSet = function (sName, fRule, oFunctionSet) {
			//values were passed and were the correct type
			if (jQuery.type(sName) === "string" && jQuery.type(fRule) === "function") {
				//function does not already exist
				if (oFunctionSet[sName] === undefined) {
					oFunctionSet[sName] = fRule;
					return true; //added
				}
			}
			return false; //not added
		};

		/**
		* Set of validation functions.
		*/
		var validationRules = {
			/**
			* Check that the field has a value
			*/
			hasValue : function (eField) {
				var nodeName = eField[0].nodeName.toLowerCase(),
					val = eField.val();

				if (nodeName === "select") {
					if (!eField.get(0).selectedIndex) { return false; }
				}
				else if (eField[0].type === "checkbox") {
					if (!eField[0].checked) { return false; }
				}
				else if (nodeName === "textarea") {
					if (jQuery.trim(val).length === 0) { return false; }
				}
				else if (val.length === 0 || val === undefined) {
					return false;
				}
				return true;
			},
			
			/**
			* Check that the field has a value
			*/
			required : function (eField) {
				return validationRules.hasValue(eField);
			},
			
			/**
			* Required only if the partner field HAS a value
			*/
			requiredIf : function (eField, sTargetID) {
				var eTarget = $('#' + sTargetID);
				if (eTarget.length) {
					if (validationRules.hasValue(eTarget)) {
						return validationRules.hasValue(eField);
					}
				}
				return true;
			},

			/**
			* Required only if the partner field DOES NOT HAVE a value
			*/
			requiredIfNot : function (eField, sTargetID) {
				var eTarget = $('#' + sTargetID);
				if (eTarget.length) {
					if (validationRules.hasValue(eTarget) === false) {
						return validationRules.hasValue(eField);
					}
				}
				return true;
			},

			/**
			* Test that the value is alphabet characters only
			*/
			alphabet : function (eField) {
				var alphabetRegex = /^[A-Za-z]+$/;
				return alphabetRegex.test(eField.val());
			},
			
			/**
			* Test that the value is numeric
			*/
			numeric : function (eField) {
				var numberRegex = /^[+\-]?\d+(\.\d+)?([eE][+\-]?\d+)?$/;
				return numberRegex.test(eField.val());
			},
			
			/**
			* Test that the value matches a valid email
			*/
			email : function (eField) {
				if (eField.val() !== '') {
					var emailRegex = new RegExp('([\\w-+]+(?:\\.[\\w-+]+)*@(?:[\\w-]+\\.)+[a-zA-Z]{2,7})');
					return emailRegex.test(eField.val());
				}
				return true;
			},
			
			/**
			* Validate password
			*/
			password : function (eField) {
				var val = eField.val(),
					strength = 1,
					rules = [
						/\S{8,}/, //min eight characters
						/[a-z]+/, //includes lower case character
						/[0-9]+/, //includes numeric character ([0-9]) or symbol
						/[A-Z]+/, //includes upper case character
						/[@!$£&*#%\^\?]+/ // includes a symbol
					];
					
				var i = 0,
					iLen = rules.length,
					result;

				//test against the rules, fail quickly
				while (i < iLen) {
					result = val.match(rules[i]);

					if (result === null) {
						return false;
					}
					i++;
				}

				return true;
			},
			
			/**
			* Test that the value matches a valid uk postcode
			* Accepted formats: 1. LN NLL eg N1 1AA 2. LLN NLL eg SW4 0QL 3. LNN NLL eg M23 4PJ 4. LLNN NLL eg WS14 0JT 5. LLNL NLL eg SW1N 4TB 6. LNL NLL eg W1C 8LQ
			*/
			postcode : function (eField) {
				var postcodeRegex = new RegExp('^[a-zA-Z]{1,2}[0-9][0-9A-Za-z]{0,1} {0,1}[0-9][A-Za-z]{2}$');
				return postcodeRegex.test(eField.val());
			},
			
			/**
			* Check value of a field against a specific field
			*/
			matchesField : function (eField, sTargetID) {
				var eTarget = $('#' + sTargetID);
				if (eTarget.length) {
					return eField.val() === eTarget.val();
				}
				return false;
			},
			
			/**
			* Check value has a minimum number of characters
			**/
			minchars : function (eField, iLen) {
				var val = eField.val(),
					iLength = iLen || 2;
				if (val.length < iLength || val === undefined) {
					return false;
				}
				return true;
			},

			/**
			* Check value against a regex
			*/
			regex : function (eField, sRegex) {
				var val = eField.val(),
					thisRegex;
				try {
					thisRegex = new RegExp(sRegex);
					if (thisRegex.test(val) === false) {
						return false;
					}
				}
				catch (e) {
					namespace.error(e);
				}
				return true;
			}

		};

		/**
		* Set of success functions.
		*/
		var successFunctions = {
			/**
			* Check value of a field against a specific field
			* TEMPORARY IMPLEMENTATION
			*/
			passwordStrength : function (eField) {
				var sClass, sMessage;
				//eField.addClass('alwaysValidate');

				var val = eField.val(),
					strength = 1,
					rules = [/\S{5,}/, /[a-z]+/, /[0-9]+/, /[A-Z]+/];
					
				var i = 0,
					iLen = rules.length;
				//test against the rules
				while (i < iLen) {
					if (val.match(rules[i])) {
						strength++;
					}
					i++;
				}

				if (strength < 2) {
					sClass = 'psWeak';
					sMessage = '<span></span>Puny';
				}
				else if (strength < 5) {
					sClass = 'psOkay';
					sMessage = '<span></span>Passable';
				}
				else {
					sClass = 'psStrong';
					sMessage = '<span></span>Powerful';
				}
				return {
					'class' : sClass,
					'message' : sMessage
				};
			}
		};

		/**
		* Validation object
		*/
		var Validator = function (eTarget, settings) {
			var _this = this;

			/**
			* Validate a form
			*/
			this.validateForm = function (event) {
				var invalidCount = 0,
					eForm = $(this),
					//collate elements to validate
					listInputs = eForm.find('input:not([type=submit]), select, textarea');

				//validate each field
				$.each(listInputs, function (index, element) {
					try {
						var validateFieldResult = _this.validateField($(element));
						if (validateFieldResult === false) {
							invalidCount++;
						}
					}
					catch (e) {
						console.log("Error in validation", e);
					}
				});

				if (invalidCount > 0) {
					if (event) {
						event.preventDefault();
						event.stopPropagation();
					}
					eForm.data('invalid', true);
					return false;
				}
				eForm.data('invalid', false);
				return true;
			};
			
			/**
			* Validate a field
			* Expects an $(input) field
			*/
			this.validateField = function (eField) {
				//test if the field is disabled
				if (eField[0].disabled === true) {
					return true;
				}

				// need to execute validation functions
				var sValidationAttr = eField.attr(settings.sValidationAttr);
				if (sValidationAttr === undefined) {
					//validation does not exists therefore it's correct...
					return true;
				}
				var oDataRules = jQuery.parseJSON(sValidationAttr.replace(/&#39;|'/g, '"'));
				if (oDataRules && oDataRules.rules) {
					var aRulesData = oDataRules.rules,
						bValid = true,
						index = 0,
						iLen = aRulesData.length;

					//check each rule
					while (index < iLen) {
						var sRuleName = aRulesData[index];
						var stringMessageData = oDataRules.messages[index];
						
						var params = false;
						
						// Set the params if defined
						if (oDataRules.params && oDataRules.params[index]) {
							params = oDataRules.params[index];
						}

						if (validationRules[sRuleName]) {
							if (validationRules[sRuleName](eField, params) === false) {
								showError(eField, stringMessageData);
								bValid = false;
								//As we've failed break out the look
								break;
							}
						}
						index++;
					}
					if (bValid === true) {
						if (eField.hasClass(settings.sValidationFailed)) {
							eField.removeClass(settings.sValidationFailed);
							hideError(eField);
						}
						if (eField.val() !== '') {
							addSuccess(eField);
						}
						return true;
					}
					return false;
				}
			};

			/**
			* Bind the events on the form
			*/
			var bind = function (eTarget) {
				var novalidate = "novalidate";

				//disable HTML5 form validation
				if (eTarget[0].nodeName.toLowerCase() === 'form') {
					eTarget.attr(novalidate, novalidate);
				}

				//validate any input that has been actioned
				eTarget
					.on("keyup", "input",  handleKeyupEvent)
					.on("blur", "input.keyPressed", handleFieldEvent)
					.on("blur change", "select, textarea", handleFieldEvent)
					.on("click", "input[type=checkbox]", function (event) {
						var eField = $(this);
						if (eField.hasClass(settings.sValidationFailed)) {
							_this.validateField(eField);
						}
					})
					.on("click", "input[type=submit]", _this.validateForm)
					.submit(_this.validateForm);
			};

			/**
			* Handle key action
			*/
			var handleKeyupEvent = function (event) {
				var key = event.which || event.keyCode,
					$this = $(this);

				if (key !== 9) {
					$this.addClass("keyPressed");
				}
				if ($this.hasClass(settings.sValidationFailed) || $this.hasClass('alwaysValidate')) {
					_this.validateField($this);
				}
			};

			/**
			* Handle blur/change actions
			*/
			var handleFieldEvent = function (event) {
				_this.validateField($(this));
			};

			/**
			* Show error
			*/
			var showError = function (eField, stringMessageData) {
				// check if the global message is visible and show if not
				//if(eServerErrorBlock.css('display') === 'none'){ showErrorBlock(true); }
				
				//remove and success message before continuing
				removeSuccess(eField);
								
				// get the message from the field
				// check to see if field error already present create text and append next to field
				
				var eInsertionPoint = getMsgInsertionPoint(eField);
				var eErrorMessage = eInsertionPoint.siblings('p.error');
				if (eErrorMessage.length === 0) {
					var sErrorHTML = '<p class="error">' +  stringMessageData + '</p>';
					eInsertionPoint.after(sErrorHTML).fadeIn();
					eField.addClass(settings.sValidationFailed).attr('aria-invalid', 'true');

					if (eField[0].nodeName.toLowerCase() === 'select') {
						eField.parent().addClass(settings.sValidationFailed);
					}

				}
				else if (eErrorMessage.text() !== stringMessageData) {
					eErrorMessage.text(stringMessageData);
				}
				return this; // to chain the function
			};
			
			/**
			* Hide error
			*/
			var hideError = function (eField) {
				// remove fields error message
				getMsgInsertionPoint(eField).siblings('p.error').remove();
				eField.removeClass(settings.sValidationFailed).attr('aria-invalid', 'false');

				if (eField[0].nodeName.toLowerCase() === 'select') {
					eField.parent().removeClass(settings.sValidationFailed);
				}

				/*var invalid = $(settings.sValidationSelect).find('p.error').length;
				if(invalid === 0 ){
					showErrorBlock(false);
				}*/
				return this; // to chain the function
			};
			
			/**
			* Get errorBlock element or create it if it does not exist
			*/
			var getErrorBlock = function () {
				var eServerErrorBlock = $(settings.sServerErrorBlockSelect);
				//create if not found
				if (eServerErrorBlock.length <= 0) {
					eServerErrorBlock = $('<div class="' + settings.sServerErrorBlockSelect + '" style="display:none" />');
					//ARIA - http://www.w3.org/TR/wai-aria-practices/#LiveRegions
					eServerErrorBlock.attr({'aria-live': 'polite', 'aria-atomic': 'false' });
					$(settings.sValidationSelect).prepend(eServerErrorBlock);
				}
				
				return eServerErrorBlock;
			};
			
			/**
			* Show the errorBlock depending upon boolean
			*/
			var showErrorBlock = function (bShow) {
				if (bShow === true) {
					eServerErrorBlock.html('<p class="errorCloud">Ooops!</p><p class="errorText">Something&lsquo;s gone a little bit skew-whiff. Please check and try again.</p>').fadeIn();
				}
				else {
					eServerErrorBlock.fadeOut().html();
				}
				return eServerErrorBlock;
			};
			
			
			
			/**
			* Add a success message
			*/
			var addSuccess = function (eField) {
				var sSuccessClass = settings.sValidationPassedMessage,
					sSuccessMessage = '',
					sSuccessFunction = '';

				//add class to item
				eField.addClass(settings.sValidationPassed);
					
				// see if success message has been set
				var sSuccessAttr = eField.attr(settings.sSuccessAttr);
				if (sSuccessAttr === undefined) {
					//success messages are not defined so halt here
					return eField;
				}
				var oSuccessData = jQuery.parseJSON(sSuccessAttr.replace(/&#39;|'/g, '"'));
				
				//get either the message or function to call for the message
				if (oSuccessData !== undefined) {
					if (oSuccessData.messages) {
						sSuccessMessage = oSuccessData.messages;
					}
					else if (oSuccessData.func) {
						sSuccessFunction = oSuccessData.func;
					}
				}
				if (sSuccessFunction.length !== 0) {
					//run function to set success message
					var oResponse = successFunctions[sSuccessFunction](eField);
					sSuccessClass = sSuccessClass + ' ' + oResponse['class'];
					sSuccessMessage = oResponse.message;
				}
				
				if (sSuccessMessage.length !== 0) {
					//get the current success message
					var eInsertionPoint = getMsgInsertionPoint(eField);
					var eValid = eInsertionPoint.siblings('.' + settings.sValidationPassedMessage);
					if (eValid.length === 0) {
						eInsertionPoint.after('<p class="' + sSuccessClass + '">' + sSuccessMessage + '</p>').fadeIn();
					}
					//else if it was a function, always update
					else if (sSuccessFunction.length !== 0) {
						eValid.attr('class', sSuccessClass).html(sSuccessMessage);
					}
				}
				
				return eField;
			};
			
			/**
			* Remove the success message
			*/
			var removeSuccess = function (eField) {
				//remove class from item
				eField.removeClass(settings.sValidationPassed);

				//remove related success messages
				getMsgInsertionPoint(eField).siblings('.' + settings.sValidationPassedMessage).remove();
				return eField;
			};
			
			/**
			* Set the insertion point for error and status messages
			* This is to cope with search fields as they have a container div
			*/
			var getMsgInsertionPoint = function (eField) {
				var insertionPoint = eField.data('insertionPoint');
				if (insertionPoint !== undefined) {
					return insertionPoint;
				}
				else {
					var eParent = eField.parent();
					var lastElement = eParent.find(':last-child');
					if (eParent.hasClass('custom-select')) {
						insertionPoint = eParent;
					}
					else if (eParent.hasClass('inline-button')) {
						insertionPoint = lastElement;
					}
					else if (eField[0].type === 'checkbox') {
						insertionPoint = eField.next();
					}
					else if (eField.hasClass('hasDatepicker')) {
						insertionPoint = lastElement;
					}
					else {
						insertionPoint = eField;//.parent('.controls').find('label');
					}
					eField.data('insertionPoint', insertionPoint);
					return insertionPoint;
				}
			};

			/**
			* Init, self executing.
			*/
			var init = (function () {
				
				// hide server validation block error
				//eServerErrorBlock = getErrorBlock();

				//bind event handlers to target
				bind(eTarget);
				
			}());

			return this;
		};

		//return out new object
		return validation;

	}({}));

}(window, jQuery));