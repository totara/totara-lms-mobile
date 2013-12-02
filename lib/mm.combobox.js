/**
 * Combo box as defined by jQuery UI
 * http://jqueryui.com/autocomplete/#combobox
 *
 * Minor modifications:
 * Reformatting of text
 * Removed _removeIfInvalid function and related calls to function
 *
 * Allows for the user to enter their own text, or select from existing options.
 */
$.widget("custom.combobox", {
    _create: function() {
        this.wrapper = $("<span>")
            .addClass("custom-combobox")
            .insertAfter(this.element);

            this.element.hide();
            this._createAutocomplete();
    },

    value: function() {
        return this.wrapper.find(".custom-combobox-input").val();
    },

    setValue:function(value) {
        this.wrapper.find(".custom-combobox-input").val(value);
    },

    _createAutocomplete: function() {
        var selected = this.element.children(":selected");
        var value = selected.val() ? selected.text() : "";

        var additionalClasses = [
            "custom-combobox-input",
            "ui-widget",
            "ui-widget-content",
            "ui-state-default",
            "ui-corner-left"
        ];
        this.input = $("<input>")
            .appendTo(this.wrapper)
            .val(value)
            .attr("title", "")
            .attr('placeholder', this.element.attr('placeholder'))
            .addClass(additionalClasses.join(" "))
            .autocomplete({
                delay: 0,
                minLength: 0,
                source: $.proxy(this, "_source"),
                appendTo: this.wrapper.closest("form")
            })
            .tooltip({
                tooltipClass: "ui-state-highlight"
            });

        this._on(this.input, {
            autocompleteselect: function(event, ui) {
                ui.item.option.selected = true;
                this._trigger("select", event, {
                    item: ui.item.option
                });
                if (ui.item !== null) {
                    $(document).trigger(
                        'combobox:select', {
                            item:ui.item.option
                        }
                    );
                }
            }
        });
    },

    _source: function(request, response) {
        var matcher = new RegExp($.ui.autocomplete.escapeRegex(request.term), "i");
        response(this.element.children("option").map(function() {
            var text = $(this).text();
            if (this.value && (!request.term || matcher.test(text)))
            return {
                label: text,
                value: text,
                option: this
            };
        }));
    },

    _destroy: function() {
        this.wrapper.remove();
        this.element.show();
    }
});