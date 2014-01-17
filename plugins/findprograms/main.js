var requires = [
    "root/externallib/text!root/plugins/findprograms/findprograms.html"
];
define(requires, function(programsTpl) {
    var plugin = {
        settings: {
            name: "findprograms",
            type: "general",
            title: "Find programs",
            icon: "img/icon/find-programs.png",
            lang: {
                component: "core"
            },
            menuURL: "#find_programs"
        },

        storage: {
            category: {type: "model"},
            categories: {type: "collection", model: "category"}
        },

        routes: [
            ["find_programs", "find_programs", "main"],
            ["find_programs/:subCatId", "sub_category", "main"],
        ],

        templates: {
            "results": {
                html: programsTpl
            }
        },

        sizes: undefined,
        last_found_programs: undefined,

         _getSizes: function() {

            // Default tablet.
            MM.plugins.findprograms.sizes = {
                withSideBar: {
                    center:$(document).innerWidth() - MM.navigation.getWidth(),
                    left:MM.navigation.getWidth()
                },
                withoutSideBar: {
                    center:"100%",
                    left:0
                }
            };

            if (MM.deviceType === "phone") {
                MM.plugins.findprograms.sizes = {
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
            if (MM.plugins.findprograms.sizes == undefined) {
                MM.plugins.findprograms._getSizes();
            }

            if (MM.deviceType === "tablet") {
                if (MM.navigation.visible === true) {
                    $("#panel-center").css({
                        'width':MM.plugins.findprograms.sizes.withSideBar.center,
                        'left':MM.plugins.findprograms.sizes.withSideBar.left
                    });
                } else {
                    $("#panel-center").css({
                        'width':MM.plugins.findprograms.sizes.withoutSideBar.center,
                        'left':MM.plugins.findprograms.sizes.withoutSideBar.left
                    });
                }
            } else if (MM.deviceType === "phone") {
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

        main: function(subCatId) {
            if (subCatId === undefined) {
                subCatId = 0;
            }
            MM.plugins.findprograms.showingCategoryId = subCatId;

            $(document).on(
                'categories_found', MM.plugins.findprograms._collateCategoriesAndPrograms
            );
            $(document).on(
                'programs_found', MM.plugins.findprograms._collateCategoriesAndPrograms
            );
            MM.plugins.findprograms._getCategories();
            MM.plugins.findprograms._getPrograms();
        },

        _getCategories: function() {
            MM.panels.showLoading('center');
            MM.assignCurrentPlugin(MM.plugins.findprograms);
            MM.moodleWSCall(
                'core_course_get_categories',
                {},
                MM.plugins.findprograms._getCategoriesSuccessful,
                {},
                MM.plugins.findprograms._getCategoriesFailure
            );
        },

        _getCategoriesSuccessful: function(data) {
            MM.plugins.findprograms.categories = data;
            $(document).trigger('categories_found');
        },

        _getCategoriesFailure: function() {

        },

        _getPrograms: function() {
            MM.moodleWSCall(
                'totara_program_get_programs',
                {},
                MM.plugins.findprograms._getProgramsSuccessful,
                {},
                MM.plugins.findprograms._getProgramsFailure
            );
        },

        _getProgramsSuccessful: function(data) {
            MM.plugins.findprograms.programs = data;
            $(document).trigger('programs_found');
        },

        _getProgramsFailure: function() {

        },

        categories: undefined,
        programs: undefined,

        _collateCategoriesAndPrograms: function() {
            if (MM.plugins.findprograms.categories !== undefined &&
                MM.plugins.findprograms.programs !== undefined
            ) {
                if (MM.plugins.findprograms.showingCategoryId === 0) {
                    MM.Router.navigate(
                        "find_programs"
                    );
                } else {
                    MM.Router.navigate(
                        "find_programs/" + MM.plugins.findprograms.showingCategoryId
                    );
                }

                // Categories is about to be rewritten so that keys are the
                // id of the category.
                // Programs will be discarded.
                var categories = {};
                var programs = MM.plugins.findprograms.programs;
                _.each(MM.plugins.findprograms.categories, function(category, index) {
                    category.programs = [];
                    category.subcategories = [];
                    category.categoryName = category.name;
                    _.each(programs, function(course, index) {
                        if (course.category === category.id) {
                            // TODO: Query db to set whether the course is in
                            // progress or not.
                            course.started = 0;
                            course.completed = 0;
                            category.programs.push(course);
                        }
                    });
                    categories[category.id] = category;
                });

                // Run through the categories setting up the sub categories for
                // each.
                _.each(categories, function(category, categoryId) {
                    if (category.parent !== 0) {
                        categories[category.parent].subcategories.push(categoryId);
                    }
                });

                // NOTE: At this point we have an object of categories (indexed by
                //       category id) that contain a 1D array of subcategories and
                //       a 1D array of programs.
                var title = MM.plugins.findprograms.settings.title;
                if (MM.plugins.findprograms.showingCategoryId !== 0) {
                    title += ' within ' + categories[
                        MM.plugins.findprograms.showingCategoryId
                    ].categoryName;
                }
                var values = {
                    'title': title,
                    'categories': categories,
                    'filter':MM.plugins.findprograms.showingCategoryId
                };
                var html = MM.tpl.render(
                    MM.plugins.findprograms.templates.results.html, values, {}
                );
                MM.panels.show('center', html, {hideRight: false});
                MM.util.setupAccordion($("#panel-center"));
                MM.util.setupBackButton();
            }
        }
    };
    MM.registerPlugin(plugin);
});