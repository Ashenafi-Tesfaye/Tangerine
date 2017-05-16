class QuestionRunView extends Backbone.View

  className: 'question'

  events:
    if Modernizr.touch
      'change input'           : 'update'
      'change textarea'        : 'update'
      'click .av-controls-prev' : 'avPrev'
      'click .autoscroll_icon' : 'scroll'
      'click .av-controls-exit' : 'avExit'
      'click .av-controls-next' : 'avNext'
      'touchstart .av-button' : 'avButton'
    else
      'change input'           : 'update'
      'change textarea'        : 'update'
      'click .av-controls-prev' : 'avPrev'
      'click .autoscroll_icon' : 'scroll'
      'click .av-controls-exit' : 'avExit'
      'click .av-controls-next' : 'avNext'
      'mousedown .av-button' : 'avButton'


  avExit: ->
    # reset the timer every time the button is pressed
    if @exitTimerId?
      clearTimeout @exitTimerId
      @exitTimerId = setTimeout @cancelExit.bind(@), QuestionRunView.EXIT_TIMER
    else
      @exitTimerId = setTimeout @cancelExit.bind(@), QuestionRunView.EXIT_TIMER

    @exitCount++
    if @exitCount > 4
      @abort()

  cancelExit: ->
    @exitCount = 0
    @exitTimerId = null

  abort: ->
    @trigger 'abort'


  startAv: ->
    @$el.find('.av-question').css
      'display': 'block'
    @resizeAvImages()

    @displayTime = (new Date()).getTime()
    @startProgressTimer() if @timeLimit isnt 0
    @startWarningTimer()  if @warningTime isnt 0
#    @playDisplaySound()
    @loadSound()
    @flashScreen()
    @highlightPrevious()

  flashScreen: ->
    window.requestAnimationFrame =>
      $modal = $('#modal')
      $modal.css('display', 'block')
      setTimeout(( window.requestAnimationFrame => $modal.css('display', 'none') ), @flashInterval )

  highlightPrevious: ->
    # highlight previous answer if "highlight previous" option selected
    if @model.getString('highlightPrevious') isnt ''
      previousValue = ResultOfQuestion(@model.get('highlightPrevious'))
      @$el.find(".av-button[data-value='#{previousValue}']").addClass('av-button-highlight')


  highlightCurrent: ->
    # highlight current answer
    if @answer isnt ''
      @$el.find(".av-button[data-value='#{@answer}']").addClass('av-button-highlight')


  stopTimers: ->
    if @warningTimerId?
      @cancelWarningTimer = true
      clearTimeout(@warningTimerId)
    if @progressTimerId?
      @cancelProgressTimer = true
      clearTimeout(@progressTimerId)

  startWarningTimer: ->
    @warningTimerId = setTimeout(@checkWarningTimer.bind(@), QuestionRunView.TIMER_INTERVAL)

  checkWarningTimer: ->
    return if @cancelWarningTimer is true

    elapsed = (new Date).getTime() - @displayTime
    if elapsed >= @warningTime
      @setWarningMessage @model.get('warningMessage')
    else
      @warningTimerId = setTimeout(@checkWarningTimer.bind(@), QuestionRunView.TIMER_INTERVAL)

  startProgressTimer: ->
    @progressTimerId = setTimeout(@checkProgressTimer.bind(@), QuestionRunView.TIMER_INTERVAL)

  checkProgressTimer: ->
    return if @cancelProgressTimer is true

    elapsed = (new Date).getTime() - @displayTime
    if elapsed >= @timeLimit
      @forceProgress(elapsed)
    else
      @progressTimerId = setTimeout(@checkProgressTimer.bind(@), QuestionRunView.TIMER_INTERVAL)

  forceProgress: (elapsed) ->
    @cancelProgressTimer = @progressTimerId?
    @cancelWarningTimer = @warningTimerId?

    @forcedTime = elapsed
    @isValid = true
    @skipped = true
    @model.set('skippable', true)
    @answer = "skipped" if @answer is ""
    @trigger "av-next"

  avButton: (e) ->
    @setWarningMessage("")
    time = (new Date).getTime() - @displayTime
    # Only respond to images, not the buttons
    return if e.target.nodeName != "IMG"
    
    $target = $(e.target).parent('button')

    value = $target.attr('data-value')

    return if value is '' # dont respond if there's no value

    notAnsweredAlready = not @responseTime?

    previousVariable = @model.getString('highlightPrevious')

    if @correctable and previousVariable isnt ''

      previousValue = ResultOfQuestion(previousVariable)

    
      if value is @answer
        # clicked current selection
        @answer = ''
        @responseTime = null

        @waitingForPrevious = true
        @lastSelected = 'current'

      else if previousValue isnt value
        # click something new
        # give the previous question a value first
        if previousValue.indexOf('-deselected') != -1 or @lastSelected is 'previous'
          SetResultOfQuestion(previousVariable, value, {responseTime:time})
          @waitingForPrevious = false
          @lastSelected = 'previous'
        else
          @answer = value
          @lastSelected = 'current'

      # click something already selected
      else if value is previousValue
        # clicked previous selection
        SetResultOfQuestion(previousVariable, "#{previousValue}-deselected")
        @waitingForPrevious = true
        @lastSelected = 'previous'



    else if notAnsweredAlready or @correctable
      @responseTime = time
      @parent.audio.play() if @parent.audio?
      @answer = value
      @lastSelected = 'current'

    isValid = @updateValidity()
    if @correctable
      if !isValid
        $target = $(e.target).parent('button')
        value = $target.attr('data-value')
        name = @model.get("name")
        time = (new Date).getTime() - @displayTime
#        errorVariable = fieldName + "-error-" + time
        errorVariable = "errorValue"
        CreateResultOfQuestion(name, 'errorValue', value, {errorResponseTime:time})

    @$el.find('button.av-button-highlight').removeClass('av-button-highlight')
    @highlightCurrent()
    @highlightPrevious()

    # do not display warning after a click
    @cancelWarningTimer = @warningTimerId?

    if @isValid
      if @autoProgress
        @cancelProgressTimer = @progressTimerId?
        if @autoProgressImmediate
          @trigger 'av-next'
        else
          delayTime = QuestionRunView.AUTO_PROGRESS_DELAY
          if @model.getNumber('transitionDelay', delayTime) isnt QuestionRunView.AUTO_PROGRESS_DELAY
            delayTime = @model.getNumber('transitionDelay')
          setTimeout (=> @trigger 'av-next'), delayTime

      if @model.getString('transitionComment') isnt ''
        @setMessage(@model.getEscapedString('transitionComment'))

    else
      @setWarningMessage(@model.getEscapedString("customValidationMessage"))
      return # do not trigger the answer event

    @trigger "answer", e, @model.get('order')


  avPrev: ->
    @trigger "av-prev"
  avNext: ->
    @trigger "av-next"


  playDisplaySound: () =>
#    @displaySoundObj?.load();
#    @displaySoundObj?.play()
    if Tangerine.audioContext?
      if @displaySound
#        @mySound = Tangerine.audioContext.createBufferSource();
##        arrayBuff = Base64Binary.decodeArrayBuffer(@displaySound.data);
#        arrayBuff = Utils.base64ToArrayBuffer(@displaySound.data);
#        Tangerine.audioContext.decodeAudioData(arrayBuff, (audioData) =>
#          @myBuffer = audioData;
#          @mySound.buffer = @myBuffer;
#          @mySound.connect(Tangerine.audioContext.destination);
#          @mySound?.start(0);
#        )
        @mySound = Tangerine.audioContext.createBufferSource();
        @mySound.buffer = @myBuffer;
        @mySound.connect(Tangerine.audioContext.destination);
        @mySound?.start(0);



  scroll: (event) ->
    @trigger "scroll", event, @model.get("order")


  initialize: (options) =>
    @on "show", => @onShow()
    @model     = options.model
    @parent    = options.parent

    @displaySound = @model.getObject('displaySound', false)

    @dataEntry = options.dataEntry
    @fontFamily = @parent.model.get('fontFamily')
    @fontStyle = "style=\"font-family: #{@parent.model.get('fontFamily')} !important;\"" if @parent.model.get("fontFamily") != ""

    unless @dataEntry
      @answer = options.answer
    else
      @answer = {}

    @name     = @model.escape("name").replace /[^A-Za-z0-9_]/g, "-"
    @type     = @model.get "type"
    @options  = @model.get "options"
    @notAsked = options.notAsked
    @isObservation = options.isObservation

    @defineSpecialCaseResults()

    if @model.getBoolean("skippable")
      @isValid = true
      @skipped = true
    else
      @isValid = false
      @skipped = false

    if @notAsked == true
      @isValid = true
      @updateResult()

    if @type == "single" or @type == "multiple"
      @button = new ButtonView
        options : @options
        mode    : @type
        dataEntry  : @dataEntry
        answer     : @answer
        fontFamily : @fontFamily

      @button.on "change rendered", => @update()

    @timeLimit      = @model.getNumber('timeLimit', 0)
    @warningTime    = @model.getNumber('warningTime', 0)
    @warningMessage = @model.getEscapedString('warningMessage')
    @autoProgress  = @model.getBoolean('autoProgress')
    @autoProgressImmediate = @model.getBoolean('autoProgressImmediate')

    @flashInterval = @model.getNumber('flashInterval', QuestionRunView.FLASH_INTERVAL)

    @keepControls = @model.getBoolean('keepControls', false)

    @correctable = @model.getBoolean('correctable', false)

    @exitTimerId   = null
    @exitCount = 0

  loadSound: =>
    if @displaySound
#      @mySound = Tangerine.audioContext.createBufferSource();
#      arrayBuff = Utils.base64ToArrayBuffer(@displaySound.data);
#      arrayBuff = Tangerine.swishSoundBuffer
#      Tangerine.audioContext.decodeAudioData(arrayBuff, (audioData) =>
#        @myBuffer = audioData;
#        console.log("@myBuffer")
#        @playDisplaySound()
#      )

#      synth = Tangerine.audioContext.createOscillator();
#      synth.type = 'square';  # sine wave
#      synth.frequency.value = 440; # value in hertz
#      synth.connect(Tangerine.audioContext.destination);
#      currentTime = Tangerine.audioContext.currentTime;
#      synth.start(currentTime);
#      synth.stop(currentTime + 0.5); # stop after 1 second


#      bufferSize = 4096
#      pinkNoise = do ->
#        b0 = undefined
#        b1 = undefined
#        b2 = undefined
#        b3 = undefined
#        b4 = undefined
#        b5 = undefined
#        b6 = undefined
#        b0 = b1 = b2 = b3 = b4 = b5 = b6 = 0.0
#        node = Tangerine.audioContext.createScriptProcessor(bufferSize, 1, 1)
#
#        node.onaudioprocess = (e) ->
#          output = e.outputBuffer.getChannelData(0)
#          i = 0
#          while i < bufferSize
#            white = Math.random() * 2 - 1
#            b0 = 0.99886 * b0 + white * 0.0555179
#            b1 = 0.99332 * b1 + white * 0.0750759
#            b2 = 0.96900 * b2 + white * 0.1538520
#            b3 = 0.86650 * b3 + white * 0.3104856
#            b4 = 0.55000 * b4 + white * 0.5329522
#            b5 = -0.7616 * b5 - (white * 0.0168980)
#            output[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362
#            output[i] *= 0.11
#            # (roughly) compensate for gain
#            b6 = white * 0.115926
#            i++
#          return
#
#        node
#      pinkNoise.connect Tangerine.audioContext.destination
#      currentTime = Tangerine.audioContext.currentTime;
#      pinkNoise.start(currentTime);
#      pinkNoise.stop(currentTime + 0.5); # stop after 1 second

      context = Tangerine.audioContext
      audioContext = Tangerine.audioContext

#      convolverGain = context.createGain()
#      convolver = context.createConvolver()
#      masterGain = context.createGain()
#      masterCompression = context.createDynamicsCompressor()

      bufferSize = 2 * Tangerine.audioContext.sampleRate
      noiseBuffer = Tangerine.audioContext.createBuffer(1, bufferSize, Tangerine.audioContext.sampleRate)
      output = noiseBuffer.getChannelData(0)
      i = 0
      while i < bufferSize
        output[i] = Math.random() * 2 - 1
        i++
      whiteNoise = Tangerine.audioContext.createBufferSource()
      whiteNoise.buffer = noiseBuffer
#      convolver.buffer = noiseBuffer
      whiteNoise.loop = true
#      whiteNoise.start 0
#      whiteNoise.connect Tangerine.audioContext.destination
#      whiteNoise.connect  convolver

#      whiteNoise.connect(convolverGain);
#      whiteNoise.connect(masterGain);
#      masterGain.connect(masterCompression);
#      masterCompression.connect(context.destination);

#      convolver.connect Tangerine.audioContext.destination
#
#      currentTime = Tangerine.audioContext.currentTime;
#      whiteNoise.start(currentTime);
#      whiteNoise.stop(0.5); # stop after 1 second

      masterGain = audioContext.createGain();
      masterGain.gain.value = 0.1;
      masterGain.connect(audioContext.destination);

      now = audioContext.currentTime;

      effect = do ->
        convolver = audioContext.createConvolver()
        noiseBuffer = audioContext.createBuffer(2, 0.5 * audioContext.sampleRate, audioContext.sampleRate)
        left = noiseBuffer.getChannelData(0)
        right = noiseBuffer.getChannelData(1)
        i = 0
        while i < noiseBuffer.length
          left[i] = Math.random() * 2 - 1
          right[i] = Math.random() * 2 - 1
          i++
        convolver.buffer = noiseBuffer
        convolver

      sawWave = audioContext.createOscillator();
      sawWave.type = "sawtooth";
#      sawWave.start(now);
      whiteNoise.start(now);
      whiteNoise.stop(0.5); # stop after 1 second
      effectGain = audioContext.createGain();

      effect.connect(effectGain);
      effectGain.connect(masterGain);
#      sawWave.connect(effect);
      whiteNoise.connect(effect);

#      /* Sweep from A3 to A6. */
      sawWave.frequency.setValueAtTime(220, now);
      sawWave.frequency.linearRampToValueAtTime(1760, now + 4);

#      /* Play raw wave through effect, then fade out. */
      effectGain.gain.setValueAtTime(1.0, now);
      effectGain.gain.setValueAtTime(1.0, now + 1);
      effectGain.gain.linearRampToValueAtTime(0.0, now + 2);

  previousAnswer: =>
    @parent.questionViews[@parent.questionIndex - 1].answer if @parent.questionIndex >= 0

  onShow: =>

    showCode = @model.getString("displayCode")

    return if _.isEmptyString(showCode)

    try
      CoffeeScript.eval.apply(@, [showCode])
    catch error
      name = ((/function (.{1,})\(/).exec(error.constructor.toString())[1])
      message = error.message
      alert "Display code error\n\n#{name}\n\n#{message}"

  update: (event) =>
    @updateResult()
    @updateValidity()
    @trigger "answer", event, @model.get("order")

  updateResult: =>
    if @notAsked == true
      if @type == "multiple"
        for option, i in @options
          @answer[@options[i].value] = "not_asked"
      else
        @answer = "not_asked"
    else
      if @type == "open"
        @answer = @$el.find("##{@cid}_#{@name}").val()
      else
        @answer = @button.answer


  updateValidity: ->

    isSkippable    = @model.getBoolean("skippable")
    isAutostopped  = @$el.hasClass("disabled_autostop")
    isLogicSkipped = @$el.hasClass("disabled_skipped")

    # have we or can we be skipped?
    if isSkippable or ( isLogicSkipped or isAutostopped )
      # YES, ok, I guess we're valid
      @isValid = true
      @skipped = Boolean(_.isEmptyString(@answer))
    else
      # NO, some kind of validation must occur now
      customValidationCode = @model.get("customValidationCode")

      @answer = "" unless @answer

      if not _.isEmptyString(customValidationCode)
#        console.log("customValidationCode: " + customValidationCode)
        try
          @isValid = CoffeeScript.eval.apply(@, [customValidationCode])
#          console.log("@isValid: " + @isValid + "for this.name: " + this.name)
        catch e
          alert "Custom Validation error\n\n#{e}"
      else
        @isValid =
          switch @type
            when "open"
              if _.isEmptyString(@answer) || (_.isEmpty(@answer) && _.isObject(@answer)) then false else true # don't use isEmpty here
            when "multiple"
              if ~_.values(@answer).indexOf("checked") then true  else false
            when "single"
              if _.isEmptyString(@answer) || (_.isEmpty(@answer) && _.isObject(@answer)) then false else true
            when "av"
              hasTime = @timeLimit isnt 0
              timeValid = (new Date).getTime - @displayTime >= @timeLimit
              notEmpty = @answer isnt ""
              notWaiting = not @waitingForPrevious
              notWaiting and (notEmpty or (hasTime and timeValid))

  setOptions: (options) =>
    @button.options = options
    @button.render()

  setAnswer: (answer) =>
    alert "setAnswer Error\nTried to set #{@type} type #{@name} question to string answer." if _.isString(answer) && @type == "multiple"
    alert "setAnswer Error\n#{@name} question requires an object" if not _.isObject(answer) && @type == "multiple"

    if @type == "multiple"
      @button.answer = $.extend(@button.answer, answer)
    else if @type == "single"
      @button.answer = answer
    else
      @answer = answer

    @updateValidity()
    @button.render()

  setMessage: (message) =>
    @$el.find(".error_message").html message

  setWarningMessage: (message) =>
    @$el.find(".av-warning-message").html message

  setProgress: (current, total)->
    @$el.find("#av-progress").html "#{current}/#{total}"


  setPrompt: (prompt) =>
    @$el.find(".prompt").html prompt

  setHint: (hint) =>
    @$el.find(".hint").html hint

  setName: ( newName = @model.get('name') ) =>
    @model.set("name", newName)
    @name = @model.escape("name").replace /[^A-Za-z0-9_]/g, "-"

  getName: =>
    @model.get("name")

  render: ->
    @$el.attr "id", "question-#{@name}"

    if not @notAsked

      if @type is 'av'
        html = "<div class='error_message'></div><div class='prompt' #{@fontStyle || ""}>#{@model.get 'prompt'}</div>
      <div class='hint' #{@fontStyle || ""}>#{(@model.get('hint') || "")}</div>"
      else
        html = "<div class='error_message'></div><div class='prompt' #{@fontStyle || ""}>#{@model.get 'prompt'}</div>
      <div class='hint' #{@fontStyle || ""}>#{(@model.get('hint') || "")}</div>"

      if @type == "open"
        if _.isString(@answer) && not _.isEmpty(@answer)
          answerValue = @answer
        if @model.get("multiline")
          html += "<div><textarea id='#{@cid}_#{@name}' data-cid='#{@cid}' value='#{answerValue || ''}'></textarea></div>"
        else
          html += "<div><input id='#{@cid}_#{@name}' data-cid='#{@cid}' value='#{answerValue || ''}'></div>"
      else if @type == "av"
        html += "<div class='av-question' id='container-#{@name}'></div>"

      else
        html += "<div class='button_container'></div>"

      html += "<img src='images/icon_scroll.png' class='icon autoscroll_icon' data-cid='#{@cid}'>" if @isObservation
      @$el.html html

      if @type == "single" or @type == "multiple"
        @button.setElement(@$el.find(".button_container"))
        @button.on "rendered", => @trigger "rendered"
        @button.render()
      else
        @trigger "rendered"

    else
      @$el.hide()
      @trigger "rendered"
    @htmlAv() if @type is 'av'

  htmlAv: ->

    #
    # Generate av question
    #
    html = ""
    assets = @parent.model.getArray('assets')
    assetMap = @model.getObject('assetMap')

    windowHeight = $(window).height() - 200
    windowWidth  = $(window).width()
    @model.layout().rows.forEach (row) ->

      rowHtml = ''
      row.columns.forEach (cell) ->
        asset = assets[cell.content]

        if cell.content != null
          imgHtml = "<button class='av-button' data-value='#{_.escape(assetMap[cell.content]||'')}'><img class='av-image' src='data:#{asset.type};base64,#{asset.imgData}'></button>"
        else
          imgHtml = ""

        if cell.align != null
          textAlign = "text-align: #{Question.AV_ALIGNMENT[cell.align]}"
        else
          textAlign = ''

        rowHtml += "<div class='av-cell' style='display:inline-block; height:#{windowHeight*(row.height/100)}px; width:#{windowWidth*(cell.width/100)}px;  #{textAlign}'>#{imgHtml}</div>"
      html += "<div class='av-row' style='height:#{windowHeight*(row.height/100)}px'>#{rowHtml}</div>"

    # wrap the old html variable
    html = "
    <div class='av-controls'>
      <button class='av-controls-prev command'>&lt;</button>
      <button class='av-controls-exit command'>x</button>
      <button class='av-controls-next command'>&gt;</button>
    </div>

    <div id='av-progress' class='av-light'></div>
    <div class='av-light av-prompt error_message'>#{@model.get('prompt')}</div>
    <div class='av-light av-warning-message'></div>
    <div class='av-layout'>#{html}</div>
    "

    @$el.find("#container-#{@name}").html html
    if (@autoProgress or @timeLimit) and not @keepControls
      @$el.find('.av-controls-prev')[0].style.opacity = 0
      @$el.find('.av-controls-next')[0].style.opacity = 0

  resizeAvImages: ->
    self = @
    @$el.find('img.av-image').each ->
      self.resizeImage(@)

  resizeImage: (img) ->

    # retry if no image width yet
    if $(img).width() == 0
      return setTimeout( (=> @resizeImage(img)) , 5)

    # resize to fit based on largest dimension
    ratio  = $(img).parent().width() / $(img).parent().height()
    pratio = $(img).parent().parent().width() / $(img).parent().parent().height()
    css = width:'100%', height:'auto'
    css = width:'auto', height:'100%' if (ratio < pratio)
    $(img).parent().css(css)

  defineSpecialCaseResults: ->
    list = ["missing", "notAsked", "skipped", "logicSkipped", "notAskedAutostop"]
    for element in list
      if @type == "single" || @type == "open"
        @[element+"Result"] = element
      if @type == "multiple"
        @[element+"Result"] = {}
        @[element+"Result"][@options[i].value] = element for option, i in @options
    return


# constants
Object.defineProperty QuestionRunView, "TIMER_INTERVAL",
  value: 20, # 20 milliseconds

Object.defineProperty QuestionRunView, "EXIT_TIMER",
  value: 5e3 # 5 seconds

Object.defineProperty QuestionRunView, "AUTO_PROGRESS_DELAY",
  value: 350

Object.defineProperty QuestionRunView, "FLASH_INTERVAL",
  value: 100
