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
            MM.plugins.feedback.currentFeedback = feedback[0];
            var html = "";

            // Save the feedback
            MM.db.insert('feedbacks', feedback);

            // Go through each question linking it with any available answer
            _.each(questions, function(question) {
                _.each(answers, function(answer) {
                    if (question.id === answer.item) {
                        question.answer = answer;
                    }
                });

                // Whilst going through all the questions, record them for
                // later use.
                MM.db.insert('questions', question);
            });

            MM.plugins.feedback._displayFeedback(feedback[0]);
        },

        _displayFeedback: function(feedback) {
            var html = "";

            html = MM.tpl.render(
                MM.plugins.feedback.templates.overview.html, feedback
            );

            MM.panels.show("center", html);
            MM.util.setupAccordion();
            $(document).find('#submit-feedback').on(
                'click', MM.plugins.feedback._saveFeedback
            );
        },

        _getFeedbackQuestionsFailure: function() {
            console.log("It died");
        },

        _saveFeedback: function() {
            var answers = $(document).find(".question-answer");
            var allRequiredAnswered = true;
            var response = [];
            _.each(answers, function(answer) {
                var answer = $(answer);
                var value = answer.val();
                if (value.trim().length === 0) {
                    value = answer.text();
                }

                if (answer.data('required') === 1) {
                    if (value.trim().length === 0) {
                        allRequiredAnswered = false;
                        return false;
                    }
                }
                response.push(
                    {'questionid':answer.data('questionid'), 'answer':value}
                );
            });
            if (!allRequiredAnswered) {
                console.log("All required answers aren't...");
            } else {
                var callBack = MM.plugins.feedback._sendAnswersSuccess;
                var errorCallBack = MM.plugins.feedback._sendAnswersFailure;
                var preSets = {};
                MM.moodleWSCall(
                    'mod_feedback_send_answers', {'answers':response}, callBack,
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

            var html = MM.tpl.render(
                MM.plugins.feedback.templates.pageaftersubmit, feedback
            );
            MM.panels.show("center", html);
            $(document).find("#continue").on(
                'click', MM.plugins.feedback._continueClicked
            );
        },

        _continueClicked: function() {
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
            var preSets = {};
            var errorCallBack = MM.plugins.feedback._getFeedbackQuestionsFailure;
            MM.moodleWSCall(
                'mod_feedback_get_questions', data, callBack, preSets,
                errorCallBack
            );
        },

        _displayQuestions: function() {
            var html = "";

            var questions = MM.db.where(
                'questions', {'feedback':MM.plugins.feedback.currentFeedback.id}
            );

            _.each(questions, function(question) {
                console.log(JSON.stringify(question));
                var x = MM.tpl.render(
                    MM.plugins.feedback.templates[question.get('typ')].html, question.toJSON()
                );
                html += x;
            });

            return html;
        }
    }

    MM.registerPlugin(plugin);
});