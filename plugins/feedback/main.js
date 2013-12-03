var templates = [
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
        info, label, textarea, multichoice, ratedmultichoice, numeric,
        textfield, captcha, pagebreak
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
            ["feedback/:courseId", "main", "main"]
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

        _getFeedbackQuestionsSuccess: function(data) {
            var questions = data.questions;
            var answers = data.answers;
            var html = "";

            _.each(answers, function(answer) {
                _.each(questions, function(question) {
                    if (question.id === answer.item) {
                        question.answer = answer;
                    }
                });
            });

            MM.db.insert('feedback', {'id':_.first(questions).feedback});
            MM.db.insert('questions', questions);

            MM.plugins.feedback._displayFeedback(questions);
        },

        _displayFeedback: function(questions) {
            var html = "";

            _.each(questions, function(question) {
                console.log("Type: " + question.typ);
                var x = MM.tpl.render(MM.plugins.feedback.templates[question.typ].html, question);
                html += x;
            });
            MM.panels.show("center", html);
        },

        _getFeedbackQuestionsFailure: function() {

        },

        main: function(courseId) {
            MM.assignCurrentPlugin(MM.plugins.feedback);
            MM.panels.showLoading("center");

            // Get the feedback for the course
            var data = {
                'courseid':courseId
            };
            var callBack = MM.plugins.feedback._getFeedbackQuestionsSuccess;
            var preSets = {};
            var errorCallBack = MM.plugins.feedback._getFeedbackQuestionsFailure;
            MM.moodleWSCall(
                'mod_feedback_get_questions', data, callBack, preSets,
                errorCallBack
            );
        }
    }

    MM.registerPlugin(plugin);
});