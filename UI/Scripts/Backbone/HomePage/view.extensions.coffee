@DragDropView = 
    makeDraggable: (model, template, element, onStart, onStop) ->
        element = element ? @$el
        html = util.applyTemplate template, model
        element.data 'model', model
        element.draggable
            appendTo: 'body'
            revert: 'invalid'
            helper: -> $ html
            start: => onStart.apply @ if onStart
            stop: => onStop.apply @ if onStop
            cursorAt: cursor: 'move', top: 5, left: 5
        return
    makeDroppable: (elements, onDrop) ->
        elements.droppable
            tolerance: 'pointer'
            hoverClass: 'ui-state-highlight'
            drop: (event, ui) => onDrop.call @, $(event.target), $(ui.draggable).data('model') if onDrop
        return
@FormView =
    getFormModel: ->
        result = {}
        if @modelFieldMapping
            for propertyIdentifier, field of @modelFieldMapping
                propertyChain = propertyIdentifier.split '.'
                last = propertyChain.length - 1
                currentParent = result
                for propertyDeapthCounter in [0 .. last - 1] by 1
                    property = propertyChain[propertyDeapthCounter]
                    currentParent[property] ?= {}
                    currentParent = currentParent[property]
                property = propertyChain[last]
                currentParent[property] = @getField(propertyIdentifier).val()
        console.log result
        return result
    getField: (property) ->
        @fields ?= {}
        result = @fields[property];
        return result if result
        if @modelFieldMapping and @modelFieldMapping[property]
            fieldIdentifier = @modelFieldMapping[property]
            result = @fields[property] = @$ fieldIdentifier
        return result
    getElement: (identifier) ->
        @elements ?= {}
        result = @elements[identifier]
        return result if result
        if @elementMapping and @elementMapping[identifier]
            elementIdentifier = @elementMapping[identifier]
            result = @elements[identifier] = @$ elementIdentifier
        return result
_.extend Backbone.Validation.callbacks,
    valid: (view, attr, selector) ->
        control = view.getField attr
        return if not control
        group = control.parents '.control-group'
        group.removeClass 'error'
        errorContainer = if control.data('error-style') is 'inline' then 'help-inline' else 'help-block'
        group.find(".#{errorContainer}").remove()
        return
    invalid: (view, attr, error, selector) ->
        control = view.getField attr
        return if not control
        group = control.parents '.control-group'
        group.addClass 'error'
        errorContainer = if control.data('error-style') is 'inline' then 'help-inline' else 'help-block'
        if group.find(".#{errorContainer}").length is 0
            group.find('.controls').append("<span class='#{errorContainer} error-message'></span>")
        group.find(".#{errorContainer}").text(error)
        return