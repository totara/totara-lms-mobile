var templates = [
    "root/externallib/text!root/plugins/feedback/pageaftersubmit.html",
    "root/externallib/text!root/plugins/feedback/overview.html",
    "root/externallib/text!root/plugins/feedback/info.html",
    "root/externallib/text!root/plugins/feedback/label.html",
    "root/externallib/text!root/plugins/feedback/textarea.html",
    "root/externallib/text!root/plugins/feedback/multichoice.html",
    "root/externallib/text!root/plugins/feedback/ratedmultichoice.html",
    "root/externallib/text!root/plugins/feedback/numeric.html",
    "root/externallib/text!root/plugins/feedback/textfield.html",
    "root/externallib/text!root/plugins/feedback/captcha.html",
    "root/externallib/text!root/plugins/feedback/pagebreak.html"
];

define(
    templates,
    function(
        pageaftersubmit, overview, info, label, textarea, multichoice,
        ratedmultichoice, numeric, textfield, captcha, pagebreak
    ) {
    var plugin = {
        settings: {
            name: "feedback",
            type: "user",
            lang: {
                component: "core"
            },
            menuURL: "#feedback"
        },

        templates: {
            'page_after_submit': {'html':pageaftersubmit},
            'overview' : {'html':overview},
            'info' : {'html':info},
            'label' : {'html':label},
            'textarea' : {'html':textarea},
            'multichoice' : {'html':multichoice},
            'multichoicerated' : {'html':ratedmultichoice},
            'numeric' : {'html':numeric},
            'textfield' : {'html':textfield},
            'captcha' : {'html':captcha},
            'pagebreak' : {'html':pagebreak}
        },

        routes: [
            ["feedback/:courseModuleId", "main", "main"]
        ],

        // Feedbacks has many feedback
        // Feedback has many questions
        // Questions has many question
        storage: {
            question: {type: "model"},
            feedback: {type: "model"},
            questions: {type: "collection", model: "question"},
            feedbacks: {type: "collection", model: "feedback"}
        },

        sizes: undefined,

        _getSizes: function() {
            // Default tablet.
            MM.plugins.feedback.sizes = {
                withSideBar: {
                    center:$(document).innerWidth() - MM.navigation.getWidth(),
                    left:MM.navigation.getWidth()
                },
                withoutSideBar: {
                    center:$(document).innerWidth(),
                    left:0
                }
            };

            if (MM.deviceType === "phone") {
                MM.plugins.feedback.sizes = {
                    withSideBar: {
                        center:0,
                        left:0
                    },
                    withoutSideBar: {
                        center:"100%",
                        left:0
                    }
                };
            }
        },

        resize: function() {
            if (MM.plugins.feedback.sizes == undefined) {
                MM.plugins.feedback._getSizes();
            }

            if (MM.navigation.visible === true) {
                $("#panel-center").css({
                    'width':MM.plugins.feedback.sizes.withSideBar.center,
                    'left':MM.plugins.feedback.sizes.withSideBar.left
                });
            } else {
                $("#panel-center").css({
                    'width':MM.plugins.feedback.sizes.withoutSideBar.center,
                    'left':MM.plugins.feedback.sizes.withoutSideBar.left
                });
            }

            if (MM.deviceType === "phone") {
                $("#panel-center").css({
                    'width':'100%',
                    'left':0
                });
            }

            $("#panel-right").hide();
        },

        cleanUp: function() {
            $("#panel-center").html("");
            $("#panel-right").show();
        },

        currentFeedback:undefined,

        _getFeedbackQuestionsSuccess: function(data) {
            var feedback = data.feedback;
            var questions = data.questions;
            var answers = data.answers;
            MM.plugins.feedback.currentFeedback = feedback;
            var html = "";

            // Clear old data before saving new version
            MM.db.remove('feedbacks', feedback.id);
            var oldQuestions = MM.db.where('questions', {'feedback': feedback.id});
            _.each(oldQuestions, function(oldQuestion) {
                MM.db.remove('questions', oldQuestion.id);
            });

            // Save the feedback
            MM.db.insert('feedbacks', feedback);

            // Go through each question linking it with any available answer
            _.each(questions, function(question) {
                question.answer = {
                    'id':0,
                    'item':0,
                    'value':''
                };
                _.each(answers, function(answer) {
                    if (question.id === answer.item) {
                        question.answer = answer;
                    }
                });

                // Whilst going through all the questions, record them for
                // later use.
                MM.db.insert('questions', question);
            });

            MM.plugins.feedback._displayFeedback(feedback);
        },

        _displayFeedback: function(feedback) {
            var html = "";

            html = MM.tpl.render(
                MM.plugins.feedback.templates.overview.html, feedback
            );

            MM.panels.show("center", html);
            MM.util.setupAccordion($("#panel-center"));
            MM.util.setupBackButton();
            $(document).find('#submit-feedback').on(
                'click', MM.plugins.feedback._saveFeedback
            );
            $(document).find('#cancel').on(
                'click', MM.plugins.feedback._cancelFeedback
            );
            $(document).find(".question-answer").on(
                'blur', MM.plugins.feedback._validateWithClassAddition
            );
        },

        _cancelFeedback: function(ev) {
            ev.preventDefault();
            window.history.back();
        },

        /**
         * Validates the element that triggers this function, expecting it
         * to have data elements of questionid and required and be either an
         * input or textarea element.
         * On error, attaches a class 'error' to the element.
         * On success, removes any class 'error' from the element.
         */
        _validateWithClassAddition: function(e) {
            var element = $(e.target);
            var qId = element.data('questionid');
            var input = element.val();

            // Multichoice selection boxes can't be validated against.
            if (_.isArray(input)) return false;

            // If the user hasn't made a selection from a selection box
            // then input will be null.
            if (input === null) return false;

            if (input.trim().length === 0) {
                input = element.text().trim();
            }
            if (!MM.plugins.feedback._validateInput(qId, input)) {
                element.addClass('error');
            } else {
                element.removeClass('error');
            }

            return false;
        },

        /**
         * Validates the input based on the presentation of the question defined
         * by questionId.
         * Currently only validates numeric input and 'required' elements.
         * Returns TRUE if errors are found. FALSE otherwise.
         */
        _validateInput: function(questionId, input) {
            var result = false;
            input = input.trim();
            var question = MM.db.get('questions', questionId);
            if (input.length !== 0) {
                if (question !== undefined) {
                    var presentation = question.get('presentation');
                    if (question.get('typ') === 'numeric') {
                        var range = presentation.split("|");
                        input = parseFloat(input);
                        if (input < parseFloat(range[0]) || input > parseFloat(range[1])) {
                            result = true;
                        }
                    } else if (question.get('typ') === 'textfield') {
                        var maxlength = presentation.split("|")[1];
                        if (input.length > maxlength) {
                            result = true;
                        }
                    }
                }
            } else if (question.get('required') === 1 && input.length == 0) {
                result = true;
            }

            return result;
        },

        _getFeedbackQuestionsFailure: function() {
            $(document).find(".errors.hidden").html(
                MM.lang.s("feedback-questions-failure")
            );
            $(document).find(".errors.hidden").removeClass('hidden');
            $(".errors")[0].scrollIntoView();
        },

        _saveFeedback: function(ev) {
            ev.preventDefault();
            var answers = $(document).find(".question-answer");
            var errors = false;
            var response = [];
            _.each(answers, function(answer) {
                var answer = $(answer);
                var value = answer.val();

                // A multi-select with no options selected will have a value
                // of null.
                if (value !== null) {
                    // A multi-select with multiple options selected will have
                    // an array of values which need to be joined by the pipe
                    // symbol.
                    if (!_.isArray(value)) {

                        // Text boxes don't have a value, they have text.
                        // However select elements have a text value that
                        // is the concatenation of all their options.
                        if (value.trim().length === 0 && !answer.is("select")) {
                            value = answer.text().trim();
                        }

                        error = MM.plugins.feedback._validateInput(
                            answer.data('questionid'), value
                        );

                        if (error) {
                            answer.addClass('error');
                        }

                        errors = errors || error
                    } else {
                        value = value.join("|");
                    }
                }

                response.push(
                    {'questionid':answer.data('questionid'), 'answer':value}
                );
            });
            if (errors) {
                $(document).find(".errors.hidden").html(
                    MM.lang.s("feedback-submit-failure")
                );
                $(document).find(".errors.hidden").removeClass('hidden');
                $(".errors")[0].scrollIntoView();
            } else {
                var callBack = MM.plugins.feedback._sendAnswersSuccess;
                var errorCallBack = MM.plugins.feedback._sendAnswersFailure;
                var preSets = {cache:false};
                MM.moodleWSCall(
                    'tm_mod_feedback_send_answers',
                    {
                        'answers':response
                    },
                    callBack,
                    preSets, errorCallBack
                );
            }
        },

        _sendAnswersSuccess: function(data) {
            // All went fine...
            // Answers is an array of saved or updated answers
            var answers = data.answers;
            _.each(answers, function(answer) {
                var id = answer.id;
                var qId = answer.questionId;
                var success = answer.success;
                var error = answer.error;
                var value = answer.answer;

                // If we didn't have an error, save the answer to the question.
                if (error.length === 0) {
                    var question = MM.db.get('questions', qId);
                    question.set('answer', {'id':id, 'item':qId, 'value':value});
                }
            });

            var value = MM.plugins.feedback.currentFeedback;
            if (value.page_after_submit === "") {
                value.page_after_submit = MM.lang.s("feedback-page-after-submit-message");
            }

            var html = MM.tpl.render(
                MM.plugins.feedback.templates.page_after_submit.html,
                value
            );
            MM.panels.show("center", html);
            $(document).find("#continue").on(
                'click', MM.plugins.feedback._continueClicked
            );
            if (!$(document).find(".errors").hasClass('hidden')) {
                $(document).find(".errors").addClass('hidden').html('');
            }
        },

        _continueClicked: function(ev) {
            ev.preventDefault();
            MM.Router.navigate(
                'courses/' + MM.plugins.feedback.currentFeedback.course,
                {trigger:true}
            );
        },

        _sendAnswersFailure: function() {
            // died...
        },

        main: function(courseModuleId) {
            MM.assignCurrentPlugin(MM.plugins.feedback);
            MM.panels.showLoading("center");

            // Get the feedback for the course
            var data = {
                'coursemoduleid':courseModuleId
            };
            var callBack = MM.plugins.feedback._getFeedbackQuestionsSuccess;
            var preSets = {cache:false};
            var errorCallBack = MM.plugins.feedback._getFeedbackQuestionsFailure;
            MM.moodleWSCall(
                'tm_mod_feedback_get_questions', data, callBack, preSets,
                errorCallBack
            );
        },

        parseTextFieldPresentation: function(presentation) {
            var parts = presentation.split("|");
            return MM.lang.s("input-maximum-length") + " " + parts[1] + " " + MM.lang.s("characters");
        },

        parseNumericPresentation: function(presentation) {
            var parts = presentation.match(/([-]?\d+)?\|([-]?\d+)?/);
            var result = "";
            if (parts[1] !== undefined && parts[2] !== undefined) {
                result = MM.lang.s("input-numeric-from") + " " + parts[1];
                result += " " + MM.lang.s("input-numeric-to") +" " + parts[2];
            } else if (parts[1] !== undefined && parts[2] === undefined) {
                result = MM.lang.s("input-numeric-minimum") + " " + parts[1];
            } else if (parts[1] === undefined && parts[2] !== undefined) {
                result = MM.lang.s("input-numeric-maximum") + " " + parts[2];
            }

            return result;
        },

        _displayQuestions: function() {
            var html = "";

            var questions = MM.db.where(
                'questions', {'feedback':MM.plugins.feedback.currentFeedback.id}
            );

            _.each(questions, function(question) {
                var x = MM.tpl.render(
                    MM.plugins.feedback.templates[question.get('typ')].html,
                    question.toJSON()
                );
                html += x;
            });

            return html;
        }
    }

    MM.registerPlugin(plugin);
});
