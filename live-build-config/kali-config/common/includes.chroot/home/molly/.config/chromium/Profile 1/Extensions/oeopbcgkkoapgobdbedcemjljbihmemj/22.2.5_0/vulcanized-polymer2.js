import { Base, Polymer, html$1 as html, IronMeta, IronControlState, dom, IronA11yKeysBehavior, add, findOriginalTarget, IronResizableBehavior, useShadow, dashToCamelCase, PaperInkyFocusBehavior, PaperInkyFocusBehaviorImpl, PaperRippleBehavior, afterNextRender, PolymerElement, html$2 as html$1, IronButtonState } from './shared_bundle_1.js';

/// BareSpecifier=@polymer\font-roboto\roboto
// Give the user the choice to opt out of font loading.
if (!window.polymerSkipLoadingFontRoboto) {
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.type = 'text/css';
  link.crossOrigin = 'anonymous';
  link.href = 'https://fonts.googleapis.com/css?family=Roboto+Mono:400,700|Roboto:400,300,300italic,400italic,500,500italic,700,700italic';
  document.head.appendChild(link);
} /// BareSpecifier=@polymer\iron-a11y-announcer\iron-a11y-announcer


const IronA11yAnnouncer = Polymer({
  _template: html`
    <style>
      :host {
        display: inline-block;
        position: fixed;
        clip: rect(0px,0px,0px,0px);
      }
    </style>
    <div aria-live\$="[[mode]]">[[_text]]</div>
`,
  is: 'iron-a11y-announcer',
  properties: {
    /**
     * The value of mode is used to set the `aria-live` attribute
     * for the element that will be announced. Valid values are: `off`,
     * `polite` and `assertive`.
     */mode: {
      type: String,
      value: 'polite'
    },
    _text: {
      type: String,
      value: ''
    }
  },
  created: function () {
    if (!IronA11yAnnouncer.instance) {
      IronA11yAnnouncer.instance = this;
    }

    document.body.addEventListener('iron-announce', this._onIronAnnounce.bind(this));
  },
  /**
   * Cause a text string to be announced by screen readers.
   *
   * @param {string} text The text that should be announced.
   */announce: function (text) {
    this._text = '';
    this.async(function () {
      this._text = text;
    }, 100);
  },
  _onIronAnnounce: function (event) {
    if (event.detail && event.detail.text) {
      this.announce(event.detail.text);
    }
  }
});
IronA11yAnnouncer.instance = null;

IronA11yAnnouncer.requestAvailability = function () {
  if (!IronA11yAnnouncer.instance) {
    IronA11yAnnouncer.instance = document.createElement('iron-a11y-announcer');
  }

  document.body.appendChild(IronA11yAnnouncer.instance);
};

var ironA11yAnnouncer = {
  IronA11yAnnouncer: IronA11yAnnouncer
}; /// BareSpecifier=@polymer\iron-validatable-behavior\iron-validatable-behavior

let IronValidatableBehaviorMeta = null; /**
                                                * `Use IronValidatableBehavior` to implement an element that validates
                                                * user input. Use the related `IronValidatorBehavior` to add custom
                                                * validation logic to an iron-input.
                                                *
                                                * By default, an `<iron-form>` element validates its fields when the user
                                                * presses the submit button. To validate a form imperatively, call the form's
                                                * `validate()` method, which in turn will call `validate()` on all its
                                                * children. By using `IronValidatableBehavior`, your custom element
                                                * will get a public `validate()`, which will return the validity of the
                                                * element, and a corresponding `invalid` attribute, which can be used for
                                                * styling.
                                                *
                                                * To implement the custom validation logic of your element, you must override
                                                * the protected `_getValidity()` method of this behaviour, rather than
                                                * `validate()`. See
                                                * [this](https://github.com/PolymerElements/iron-form/blob/master/demo/simple-element.html)
                                                * for an example.
                                                *
                                                * ### Accessibility
                                                *
                                                * Changing the `invalid` property, either manually or by calling `validate()`
                                                * will update the `aria-invalid` attribute.
                                                *
                                                * @demo demo/index.html
                                                * @polymerBehavior
                                                */
const IronValidatableBehavior = {
  properties: {
    /**
     * Name of the validator to use.
     */validator: {
      type: String
    },
    /**
     * True if the last call to `validate` is invalid.
     */invalid: {
      notify: true,
      reflectToAttribute: true,
      type: Boolean,
      value: false,
      observer: '_invalidChanged'
    }
  },
  registered: function () {
    IronValidatableBehaviorMeta = new IronMeta({
      type: 'validator'
    });
  },
  _invalidChanged: function () {
    if (this.invalid) {
      this.setAttribute('aria-invalid', 'true');
    } else {
      this.removeAttribute('aria-invalid');
    }
  },

  /* Recompute this every time it's needed, because we don't know if the
   * underlying IronValidatableBehaviorMeta has changed. */get _validator() {
    return IronValidatableBehaviorMeta && IronValidatableBehaviorMeta.byKey(this.validator);
  },

  /**
   * @return {boolean} True if the validator `validator` exists.
   */hasValidator: function () {
    return this._validator != null;
  },
  /**
   * Returns true if the `value` is valid, and updates `invalid`. If you want
   * your element to have custom validation logic, do not override this method;
   * override `_getValidity(value)` instead.
    * @param {Object} value Deprecated: The value to be validated. By default,
   * it is passed to the validator's `validate()` function, if a validator is
   set.
   * If this argument is not specified, then the element's `value` property
   * is used, if it exists.
   * @return {boolean} True if `value` is valid.
   */validate: function (value) {
    // If this is an element that also has a value property, and there was
    // no explicit value argument passed, use the element's property instead.
    if (value === undefined && this.value !== undefined) this.invalid = !this._getValidity(this.value);else this.invalid = !this._getValidity(value);
    return !this.invalid;
  },
  /**
   * Returns true if `value` is valid.  By default, it is passed
   * to the validator's `validate()` function, if a validator is set. You
   * should override this method if you want to implement custom validity
   * logic for your element.
   *
   * @param {Object} value The value to be validated.
   * @return {boolean} True if `value` is valid.
   */_getValidity: function (value) {
    if (this.hasValidator()) {
      return this._validator.validate(value);
    }

    return true;
  }
};
var ironValidatableBehavior = {
  get IronValidatableBehaviorMeta() {
    return IronValidatableBehaviorMeta;
  },

  IronValidatableBehavior: IronValidatableBehavior
}; /// BareSpecifier=@polymer\iron-autogrow-textarea\iron-autogrow-textarea

Polymer({
  _template: html`
    <style>
      :host {
        display: inline-block;
        position: relative;
        width: 400px;
        border: 1px solid;
        padding: 2px;
        -moz-appearance: textarea;
        -webkit-appearance: textarea;
        overflow: hidden;
      }

      .mirror-text {
        visibility: hidden;
        word-wrap: break-word;
        @apply --iron-autogrow-textarea;
      }

      .fit {
        @apply --layout-fit;
      }

      textarea {
        position: relative;
        outline: none;
        border: none;
        resize: none;
        background: inherit;
        color: inherit;
        /* see comments in template */
        width: 100%;
        height: 100%;
        font-size: inherit;
        font-family: inherit;
        line-height: inherit;
        text-align: inherit;
        @apply --iron-autogrow-textarea;
      }

      textarea::-webkit-input-placeholder {
        @apply --iron-autogrow-textarea-placeholder;
      }

      textarea:-moz-placeholder {
        @apply --iron-autogrow-textarea-placeholder;
      }

      textarea::-moz-placeholder {
        @apply --iron-autogrow-textarea-placeholder;
      }

      textarea:-ms-input-placeholder {
        @apply --iron-autogrow-textarea-placeholder;
      }
    </style>

    <!-- the mirror sizes the input/textarea so it grows with typing -->
    <!-- use &#160; instead &nbsp; of to allow this element to be used in XHTML -->
    <div id="mirror" class="mirror-text" aria-hidden="true">&nbsp;</div>

    <!-- size the input/textarea with a div, because the textarea has intrinsic size in ff -->
    <div class="textarea-container fit">
      <textarea id="textarea" name\$="[[name]]" aria-label\$="[[label]]" autocomplete\$="[[autocomplete]]" autofocus\$="[[autofocus]]" inputmode\$="[[inputmode]]" placeholder\$="[[placeholder]]" readonly\$="[[readonly]]" required\$="[[required]]" disabled\$="[[disabled]]" rows\$="[[rows]]" minlength\$="[[minlength]]" maxlength\$="[[maxlength]]"></textarea>
    </div>
`,
  is: 'iron-autogrow-textarea',
  behaviors: [IronValidatableBehavior, IronControlState],
  properties: {
    /**
     * Use this property instead of `bind-value` for two-way data binding.
     * @type {string|number}
     */value: {
      observer: '_valueChanged',
      type: String,
      notify: true
    },
    /**
     * This property is deprecated, and just mirrors `value`. Use `value`
     * instead.
     * @type {string|number}
     */bindValue: {
      observer: '_bindValueChanged',
      type: String,
      notify: true
    },
    /**
     * The initial number of rows.
     *
     * @attribute rows
     * @type number
     * @default 1
     */rows: {
      type: Number,
      value: 1,
      observer: '_updateCached'
    },
    /**
     * The maximum number of rows this element can grow to until it
     * scrolls. 0 means no maximum.
     *
     * @attribute maxRows
     * @type number
     * @default 0
     */maxRows: {
      type: Number,
      value: 0,
      observer: '_updateCached'
    },
    /**
     * Bound to the textarea's `autocomplete` attribute.
     */autocomplete: {
      type: String,
      value: 'off'
    },
    /**
     * Bound to the textarea's `autofocus` attribute.
     */autofocus: {
      type: Boolean,
      value: false
    },
    /**
     * Bound to the textarea's `inputmode` attribute.
     */inputmode: {
      type: String
    },
    /**
     * Bound to the textarea's `placeholder` attribute.
     */placeholder: {
      type: String
    },
    /**
     * Bound to the textarea's `readonly` attribute.
     */readonly: {
      type: String
    },
    /**
     * Set to true to mark the textarea as required.
     */required: {
      type: Boolean
    },
    /**
     * The minimum length of the input value.
     */minlength: {
      type: Number
    },
    /**
     * The maximum length of the input value.
     */maxlength: {
      type: Number
    },
    /**
     * Bound to the textarea's `aria-label` attribute.
     */label: {
      type: String
    }
  },
  listeners: {
    'input': '_onInput'
  },

  /**
   * Returns the underlying textarea.
   * @return {!HTMLTextAreaElement}
   */get textarea() {
    return this.$.textarea;
  },

  /**
   * Returns textarea's selection start.
   * @return {number}
   */get selectionStart() {
    return this.$.textarea.selectionStart;
  },

  /**
   * Returns textarea's selection end.
   * @return {number}
   */get selectionEnd() {
    return this.$.textarea.selectionEnd;
  },

  /**
   * Sets the textarea's selection start.
   */set selectionStart(value) {
    this.$.textarea.selectionStart = value;
  },

  /**
   * Sets the textarea's selection end.
   */set selectionEnd(value) {
    this.$.textarea.selectionEnd = value;
  },

  attached: function () {
    /* iOS has an arbitrary left margin of 3px that isn't present
     * in any other browser, and means that the paper-textarea's cursor
     * overlaps the label.
     * See https://github.com/PolymerElements/paper-input/issues/468.
     */var IS_IOS = navigator.userAgent.match(/iP(?:[oa]d|hone)/);

    if (IS_IOS) {
      this.$.textarea.style.marginLeft = '-3px';
    }
  },
  /**
   * Returns true if `value` is valid. The validator provided in `validator`
   * will be used first, if it exists; otherwise, the `textarea`'s validity
   * is used.
   * @return {boolean} True if the value is valid.
   */validate: function () {
    // Use the nested input's native validity.
    var valid = this.$.textarea.validity.valid; // Only do extra checking if the browser thought this was valid.

    if (valid) {
      // Empty, required input is invalid
      if (this.required && this.value === '') {
        valid = false;
      } else if (this.hasValidator()) {
        valid = IronValidatableBehavior.validate.call(this, this.value);
      }
    }

    this.invalid = !valid;
    this.fire('iron-input-validate');
    return valid;
  },
  _bindValueChanged: function (bindValue) {
    this.value = bindValue;
  },
  _valueChanged: function (value) {
    var textarea = this.textarea;

    if (!textarea) {
      return;
    } // If the bindValue changed manually, then we need to also update
    // the underlying textarea's value. Otherwise this change was probably
    // generated from the _onInput handler, and the two values are already
    // the same.


    if (textarea.value !== value) {
      textarea.value = !(value || value === 0) ? '' : value;
    }

    this.bindValue = value;
    this.$.mirror.innerHTML = this._valueForMirror(); // Manually notify because we don't want to notify until after setting
    // value.

    this.fire('bind-value-changed', {
      value: this.bindValue
    });
  },
  _onInput: function (event) {
    var eventPath = dom(event).path;
    this.value = eventPath ? eventPath[0].value : event.target.value;
  },
  _constrain: function (tokens) {
    var _tokens;

    tokens = tokens || ['']; // Enforce the min and max heights for a multiline input to avoid
    // measurement

    if (this.maxRows > 0 && tokens.length > this.maxRows) {
      _tokens = tokens.slice(0, this.maxRows);
    } else {
      _tokens = tokens.slice(0);
    }

    while (this.rows > 0 && _tokens.length < this.rows) {
      _tokens.push('');
    } // Use &#160; instead &nbsp; of to allow this element to be used in XHTML.


    return _tokens.join('<br/>') + '&#160;';
  },
  _valueForMirror: function () {
    var input = this.textarea;

    if (!input) {
      return;
    }

    this.tokens = input && input.value ? input.value.replace(/&/gm, '&amp;').replace(/"/gm, '&quot;').replace(/'/gm, '&#39;').replace(/</gm, '&lt;').replace(/>/gm, '&gt;').split('\n') : [''];
    return this._constrain(this.tokens);
  },
  _updateCached: function () {
    this.$.mirror.innerHTML = this._constrain(this.tokens);
  }
}); /// BareSpecifier=@polymer\iron-form-element-behavior\iron-form-element-behavior

const IronFormElementBehavior = {
  properties: {
    /**
     * The name of this element.
     */name: {
      type: String
    },
    /**
     * The value for this element.
     * @type {*}
     */value: {
      notify: true,
      type: String
    },
    /**
     * Set to true to mark the input as required. If used in a form, a
     * custom element that uses this behavior should also use
     * IronValidatableBehavior and define a custom validation method.
     * Otherwise, a `required` element will always be considered valid.
     * It's also strongly recommended to provide a visual style for the element
     * when its value is invalid.
     */required: {
      type: Boolean,
      value: false
    }
  },
  // Empty implementations for backcompatibility.
  attached: function () {},
  detached: function () {}
};
var ironFormElementBehavior = {
  IronFormElementBehavior: IronFormElementBehavior
}; /// BareSpecifier=@polymer\iron-checked-element-behavior\iron-checked-element-behavior

const IronCheckedElementBehaviorImpl = {
  properties: {
    /**
     * Fired when the checked state changes.
     *
     * @event iron-change
     */ /**
         * Gets or sets the state, `true` is checked and `false` is unchecked.
         */checked: {
      type: Boolean,
      value: false,
      reflectToAttribute: true,
      notify: true,
      observer: '_checkedChanged'
    },
    /**
     * If true, the button toggles the active state with each tap or press
     * of the spacebar.
     */toggles: {
      type: Boolean,
      value: true,
      reflectToAttribute: true
    },
    /* Overriden from IronFormElementBehavior */value: {
      type: String,
      value: 'on',
      observer: '_valueChanged'
    }
  },
  observers: ['_requiredChanged(required)'],
  created: function () {
    // Used by `iron-form` to handle the case that an element with this behavior
    // doesn't have a role of 'checkbox' or 'radio', but should still only be
    // included when the form is serialized if `this.checked === true`.
    this._hasIronCheckedElementBehavior = true;
  },
  /**
   * Returns false if the element is required and not checked, and true
   * otherwise.
   * @param {*=} _value Ignored.
   * @return {boolean} true if `required` is false or if `checked` is true.
   */_getValidity: function (_value) {
    return this.disabled || !this.required || this.checked;
  },
  /**
   * Update the aria-required label when `required` is changed.
   */_requiredChanged: function () {
    if (this.required) {
      this.setAttribute('aria-required', 'true');
    } else {
      this.removeAttribute('aria-required');
    }
  },
  /**
   * Fire `iron-changed` when the checked state changes.
   */_checkedChanged: function () {
    this.active = this.checked;
    this.fire('iron-change');
  },
  /**
   * Reset value to 'on' if it is set to `undefined`.
   */_valueChanged: function () {
    if (this.value === undefined || this.value === null) {
      this.value = 'on';
    }
  }
}; /** @polymerBehavior */
const IronCheckedElementBehavior = [IronFormElementBehavior, IronValidatableBehavior, IronCheckedElementBehaviorImpl];
var ironCheckedElementBehavior = {
  IronCheckedElementBehaviorImpl: IronCheckedElementBehaviorImpl,
  IronCheckedElementBehavior: IronCheckedElementBehavior
}; /// BareSpecifier=@polymer\iron-fit-behavior\iron-fit-behavior

const IronFitBehavior = {
  properties: {
    /**
     * The element that will receive a `max-height`/`width`. By default it is
     * the same as `this`, but it can be set to a child element. This is useful,
     * for example, for implementing a scrolling region inside the element.
     * @type {!Element}
     */sizingTarget: {
      type: Object,
      value: function () {
        return this;
      }
    },
    /**
     * The element to fit `this` into.
     */fitInto: {
      type: Object,
      value: window
    },
    /**
     * Will position the element around the positionTarget without overlapping
     * it.
     */noOverlap: {
      type: Boolean
    },
    /**
     * The element that should be used to position the element. If not set, it
     * will default to the parent node.
     * @type {!Element}
     */positionTarget: {
      type: Element
    },
    /**
     * The orientation against which to align the element horizontally
     * relative to the `positionTarget`. Possible values are "left", "right",
     * "center", "auto".
     */horizontalAlign: {
      type: String
    },
    /**
     * The orientation against which to align the element vertically
     * relative to the `positionTarget`. Possible values are "top", "bottom",
     * "middle", "auto".
     */verticalAlign: {
      type: String
    },
    /**
     * If true, it will use `horizontalAlign` and `verticalAlign` values as
     * preferred alignment and if there's not enough space, it will pick the
     * values which minimize the cropping.
     */dynamicAlign: {
      type: Boolean
    },
    /**
     * A pixel value that will be added to the position calculated for the
     * given `horizontalAlign`, in the direction of alignment. You can think
     * of it as increasing or decreasing the distance to the side of the
     * screen given by `horizontalAlign`.
     *
     * If `horizontalAlign` is "left" or "center", this offset will increase or
     * decrease the distance to the left side of the screen: a negative offset
     * will move the dropdown to the left; a positive one, to the right.
     *
     * Conversely if `horizontalAlign` is "right", this offset will increase
     * or decrease the distance to the right side of the screen: a negative
     * offset will move the dropdown to the right; a positive one, to the left.
     */horizontalOffset: {
      type: Number,
      value: 0,
      notify: true
    },
    /**
     * A pixel value that will be added to the position calculated for the
     * given `verticalAlign`, in the direction of alignment. You can think
     * of it as increasing or decreasing the distance to the side of the
     * screen given by `verticalAlign`.
     *
     * If `verticalAlign` is "top" or "middle", this offset will increase or
     * decrease the distance to the top side of the screen: a negative offset
     * will move the dropdown upwards; a positive one, downwards.
     *
     * Conversely if `verticalAlign` is "bottom", this offset will increase
     * or decrease the distance to the bottom side of the screen: a negative
     * offset will move the dropdown downwards; a positive one, upwards.
     */verticalOffset: {
      type: Number,
      value: 0,
      notify: true
    },
    /**
     * Set to true to auto-fit on attach.
     */autoFitOnAttach: {
      type: Boolean,
      value: false
    },
    /** @type {?Object} */_fitInfo: {
      type: Object
    }
  },

  get _fitWidth() {
    var fitWidth;

    if (this.fitInto === window) {
      fitWidth = this.fitInto.innerWidth;
    } else {
      fitWidth = this.fitInto.getBoundingClientRect().width;
    }

    return fitWidth;
  },

  get _fitHeight() {
    var fitHeight;

    if (this.fitInto === window) {
      fitHeight = this.fitInto.innerHeight;
    } else {
      fitHeight = this.fitInto.getBoundingClientRect().height;
    }

    return fitHeight;
  },

  get _fitLeft() {
    var fitLeft;

    if (this.fitInto === window) {
      fitLeft = 0;
    } else {
      fitLeft = this.fitInto.getBoundingClientRect().left;
    }

    return fitLeft;
  },

  get _fitTop() {
    var fitTop;

    if (this.fitInto === window) {
      fitTop = 0;
    } else {
      fitTop = this.fitInto.getBoundingClientRect().top;
    }

    return fitTop;
  },

  /**
   * The element that should be used to position the element,
   * if no position target is configured.
   */get _defaultPositionTarget() {
    var parent = dom(this).parentNode;

    if (parent && parent.nodeType === Node.DOCUMENT_FRAGMENT_NODE) {
      parent = parent.host;
    }

    return parent;
  },

  /**
   * The horizontal align value, accounting for the RTL/LTR text direction.
   */get _localeHorizontalAlign() {
    if (this._isRTL) {
      // In RTL, "left" becomes "right".
      if (this.horizontalAlign === 'right') {
        return 'left';
      }

      if (this.horizontalAlign === 'left') {
        return 'right';
      }
    }

    return this.horizontalAlign;
  },

  /**
   * True if the element should be positioned instead of centered.
   * @private
   */get __shouldPosition() {
    return (this.horizontalAlign || this.verticalAlign) && this.positionTarget;
  },

  attached: function () {
    // Memoize this to avoid expensive calculations & relayouts.
    // Make sure we do it only once
    if (typeof this._isRTL === 'undefined') {
      this._isRTL = window.getComputedStyle(this).direction == 'rtl';
    }

    this.positionTarget = this.positionTarget || this._defaultPositionTarget;

    if (this.autoFitOnAttach) {
      if (window.getComputedStyle(this).display === 'none') {
        setTimeout(function () {
          this.fit();
        }.bind(this));
      } else {
        // NOTE: shadydom applies distribution asynchronously
        // for performance reasons webcomponents/shadydom#120
        // Flush to get correct layout info.
        window.ShadyDOM && ShadyDOM.flush();
        this.fit();
      }
    }
  },
  detached: function () {
    if (this.__deferredFit) {
      clearTimeout(this.__deferredFit);
      this.__deferredFit = null;
    }
  },
  /**
   * Positions and fits the element into the `fitInto` element.
   */fit: function () {
    this.position();
    this.constrain();
    this.center();
  },
  /**
   * Memoize information needed to position and size the target element.
   * @suppress {deprecated}
   */_discoverInfo: function () {
    if (this._fitInfo) {
      return;
    }

    var target = window.getComputedStyle(this);
    var sizer = window.getComputedStyle(this.sizingTarget);
    this._fitInfo = {
      inlineStyle: {
        top: this.style.top || '',
        left: this.style.left || '',
        position: this.style.position || ''
      },
      sizerInlineStyle: {
        maxWidth: this.sizingTarget.style.maxWidth || '',
        maxHeight: this.sizingTarget.style.maxHeight || '',
        boxSizing: this.sizingTarget.style.boxSizing || ''
      },
      positionedBy: {
        vertically: target.top !== 'auto' ? 'top' : target.bottom !== 'auto' ? 'bottom' : null,
        horizontally: target.left !== 'auto' ? 'left' : target.right !== 'auto' ? 'right' : null
      },
      sizedBy: {
        height: sizer.maxHeight !== 'none',
        width: sizer.maxWidth !== 'none',
        minWidth: parseInt(sizer.minWidth, 10) || 0,
        minHeight: parseInt(sizer.minHeight, 10) || 0
      },
      margin: {
        top: parseInt(target.marginTop, 10) || 0,
        right: parseInt(target.marginRight, 10) || 0,
        bottom: parseInt(target.marginBottom, 10) || 0,
        left: parseInt(target.marginLeft, 10) || 0
      }
    };
  },
  /**
   * Resets the target element's position and size constraints, and clear
   * the memoized data.
   */resetFit: function () {
    var info = this._fitInfo || {};

    for (var property in info.sizerInlineStyle) {
      this.sizingTarget.style[property] = info.sizerInlineStyle[property];
    }

    for (var property in info.inlineStyle) {
      this.style[property] = info.inlineStyle[property];
    }

    this._fitInfo = null;
  },
  /**
   * Equivalent to calling `resetFit()` and `fit()`. Useful to call this after
   * the element or the `fitInto` element has been resized, or if any of the
   * positioning properties (e.g. `horizontalAlign, verticalAlign`) is updated.
   * It preserves the scroll position of the sizingTarget.
   */refit: function () {
    var scrollLeft = this.sizingTarget.scrollLeft;
    var scrollTop = this.sizingTarget.scrollTop;
    this.resetFit();
    this.fit();
    this.sizingTarget.scrollLeft = scrollLeft;
    this.sizingTarget.scrollTop = scrollTop;
  },
  /**
   * Positions the element according to `horizontalAlign, verticalAlign`.
   */position: function () {
    if (!this.__shouldPosition) {
      // needs to be centered, and it is done after constrain.
      return;
    }

    this._discoverInfo();

    this.style.position = 'fixed'; // Need border-box for margin/padding.

    this.sizingTarget.style.boxSizing = 'border-box'; // Set to 0, 0 in order to discover any offset caused by parent stacking
    // contexts.

    this.style.left = '0px';
    this.style.top = '0px';
    var rect = this.getBoundingClientRect();

    var positionRect = this.__getNormalizedRect(this.positionTarget);

    var fitRect = this.__getNormalizedRect(this.fitInto);

    var margin = this._fitInfo.margin; // Consider the margin as part of the size for position calculations.

    var size = {
      width: rect.width + margin.left + margin.right,
      height: rect.height + margin.top + margin.bottom
    };

    var position = this.__getPosition(this._localeHorizontalAlign, this.verticalAlign, size, rect, positionRect, fitRect);

    var left = position.left + margin.left;
    var top = position.top + margin.top; // We first limit right/bottom within fitInto respecting the margin,
    // then use those values to limit top/left.

    var right = Math.min(fitRect.right - margin.right, left + rect.width);
    var bottom = Math.min(fitRect.bottom - margin.bottom, top + rect.height); // Keep left/top within fitInto respecting the margin.

    left = Math.max(fitRect.left + margin.left, Math.min(left, right - this._fitInfo.sizedBy.minWidth));
    top = Math.max(fitRect.top + margin.top, Math.min(top, bottom - this._fitInfo.sizedBy.minHeight)); // Use right/bottom to set maxWidth/maxHeight, and respect
    // minWidth/minHeight.

    this.sizingTarget.style.maxWidth = Math.max(right - left, this._fitInfo.sizedBy.minWidth) + 'px';
    this.sizingTarget.style.maxHeight = Math.max(bottom - top, this._fitInfo.sizedBy.minHeight) + 'px'; // Remove the offset caused by any stacking context.

    this.style.left = left - rect.left + 'px';
    this.style.top = top - rect.top + 'px';
  },
  /**
   * Constrains the size of the element to `fitInto` by setting `max-height`
   * and/or `max-width`.
   */constrain: function () {
    if (this.__shouldPosition) {
      return;
    }

    this._discoverInfo();

    var info = this._fitInfo; // position at (0px, 0px) if not already positioned, so we can measure the
    // natural size.

    if (!info.positionedBy.vertically) {
      this.style.position = 'fixed';
      this.style.top = '0px';
    }

    if (!info.positionedBy.horizontally) {
      this.style.position = 'fixed';
      this.style.left = '0px';
    } // need border-box for margin/padding


    this.sizingTarget.style.boxSizing = 'border-box'; // constrain the width and height if not already set

    var rect = this.getBoundingClientRect();

    if (!info.sizedBy.height) {
      this.__sizeDimension(rect, info.positionedBy.vertically, 'top', 'bottom', 'Height');
    }

    if (!info.sizedBy.width) {
      this.__sizeDimension(rect, info.positionedBy.horizontally, 'left', 'right', 'Width');
    }
  },
  /**
   * @protected
   * @deprecated
   */_sizeDimension: function (rect, positionedBy, start, end, extent) {
    this.__sizeDimension(rect, positionedBy, start, end, extent);
  },
  /**
   * @private
   */__sizeDimension: function (rect, positionedBy, start, end, extent) {
    var info = this._fitInfo;

    var fitRect = this.__getNormalizedRect(this.fitInto);

    var max = extent === 'Width' ? fitRect.width : fitRect.height;
    var flip = positionedBy === end;
    var offset = flip ? max - rect[end] : rect[start];
    var margin = info.margin[flip ? start : end];
    var offsetExtent = 'offset' + extent;
    var sizingOffset = this[offsetExtent] - this.sizingTarget[offsetExtent];
    this.sizingTarget.style['max' + extent] = max - margin - offset - sizingOffset + 'px';
  },
  /**
   * Centers horizontally and vertically if not already positioned. This also
   * sets `position:fixed`.
   */center: function () {
    if (this.__shouldPosition) {
      return;
    }

    this._discoverInfo();

    var positionedBy = this._fitInfo.positionedBy;

    if (positionedBy.vertically && positionedBy.horizontally) {
      // Already positioned.
      return;
    } // Need position:fixed to center


    this.style.position = 'fixed'; // Take into account the offset caused by parents that create stacking
    // contexts (e.g. with transform: translate3d). Translate to 0,0 and
    // measure the bounding rect.

    if (!positionedBy.vertically) {
      this.style.top = '0px';
    }

    if (!positionedBy.horizontally) {
      this.style.left = '0px';
    } // It will take in consideration margins and transforms


    var rect = this.getBoundingClientRect();

    var fitRect = this.__getNormalizedRect(this.fitInto);

    if (!positionedBy.vertically) {
      var top = fitRect.top - rect.top + (fitRect.height - rect.height) / 2;
      this.style.top = top + 'px';
    }

    if (!positionedBy.horizontally) {
      var left = fitRect.left - rect.left + (fitRect.width - rect.width) / 2;
      this.style.left = left + 'px';
    }
  },
  __getNormalizedRect: function (target) {
    if (target === document.documentElement || target === window) {
      return {
        top: 0,
        left: 0,
        width: window.innerWidth,
        height: window.innerHeight,
        right: window.innerWidth,
        bottom: window.innerHeight
      };
    }

    return target.getBoundingClientRect();
  },
  __getOffscreenArea: function (position, size, fitRect) {
    var verticalCrop = Math.min(0, position.top) + Math.min(0, fitRect.bottom - (position.top + size.height));
    var horizontalCrop = Math.min(0, position.left) + Math.min(0, fitRect.right - (position.left + size.width));
    return Math.abs(verticalCrop) * size.width + Math.abs(horizontalCrop) * size.height;
  },
  __getPosition: function (hAlign, vAlign, size, sizeNoMargins, positionRect, fitRect) {
    // All the possible configurations.
    // Ordered as top-left, top-right, bottom-left, bottom-right.
    var positions = [{
      verticalAlign: 'top',
      horizontalAlign: 'left',
      top: positionRect.top + this.verticalOffset,
      left: positionRect.left + this.horizontalOffset
    }, {
      verticalAlign: 'top',
      horizontalAlign: 'right',
      top: positionRect.top + this.verticalOffset,
      left: positionRect.right - size.width - this.horizontalOffset
    }, {
      verticalAlign: 'bottom',
      horizontalAlign: 'left',
      top: positionRect.bottom - size.height - this.verticalOffset,
      left: positionRect.left + this.horizontalOffset
    }, {
      verticalAlign: 'bottom',
      horizontalAlign: 'right',
      top: positionRect.bottom - size.height - this.verticalOffset,
      left: positionRect.right - size.width - this.horizontalOffset
    }];

    if (this.noOverlap) {
      // Duplicate.
      for (var i = 0, l = positions.length; i < l; i++) {
        var copy = {};

        for (var key in positions[i]) {
          copy[key] = positions[i][key];
        }

        positions.push(copy);
      } // Horizontal overlap only.


      positions[0].top = positions[1].top += positionRect.height;
      positions[2].top = positions[3].top -= positionRect.height; // Vertical overlap only.

      positions[4].left = positions[6].left += positionRect.width;
      positions[5].left = positions[7].left -= positionRect.width;
    } // Consider auto as null for coding convenience.


    vAlign = vAlign === 'auto' ? null : vAlign;
    hAlign = hAlign === 'auto' ? null : hAlign;

    if (!hAlign || hAlign === 'center') {
      positions.push({
        verticalAlign: 'top',
        horizontalAlign: 'center',
        top: positionRect.top + this.verticalOffset + (this.noOverlap ? positionRect.height : 0),
        left: positionRect.left - sizeNoMargins.width / 2 + positionRect.width / 2 + this.horizontalOffset
      });
      positions.push({
        verticalAlign: 'bottom',
        horizontalAlign: 'center',
        top: positionRect.bottom - size.height - this.verticalOffset - (this.noOverlap ? positionRect.height : 0),
        left: positionRect.left - sizeNoMargins.width / 2 + positionRect.width / 2 + this.horizontalOffset
      });
    }

    if (!vAlign || vAlign === 'middle') {
      positions.push({
        verticalAlign: 'middle',
        horizontalAlign: 'left',
        top: positionRect.top - sizeNoMargins.height / 2 + positionRect.height / 2 + this.verticalOffset,
        left: positionRect.left + this.horizontalOffset + (this.noOverlap ? positionRect.width : 0)
      });
      positions.push({
        verticalAlign: 'middle',
        horizontalAlign: 'right',
        top: positionRect.top - sizeNoMargins.height / 2 + positionRect.height / 2 + this.verticalOffset,
        left: positionRect.right - size.width - this.horizontalOffset - (this.noOverlap ? positionRect.width : 0)
      });
    }

    if (vAlign === 'middle' && hAlign === 'center') {
      positions.push({
        verticalAlign: 'middle',
        horizontalAlign: 'center',
        top: positionRect.top - sizeNoMargins.height / 2 + positionRect.height / 2 + this.verticalOffset,
        left: positionRect.left - sizeNoMargins.width / 2 + positionRect.width / 2 + this.horizontalOffset
      });
    }

    var position;

    for (var i = 0; i < positions.length; i++) {
      var candidate = positions[i];
      var vAlignOk = candidate.verticalAlign === vAlign;
      var hAlignOk = candidate.horizontalAlign === hAlign; // If both vAlign and hAlign are defined, return exact match.
      // For dynamicAlign and noOverlap we'll have more than one candidate, so
      // we'll have to check the offscreenArea to make the best choice.

      if (!this.dynamicAlign && !this.noOverlap && vAlignOk && hAlignOk) {
        position = candidate;
        break;
      } // Align is ok if alignment preferences are respected. If no preferences,
      // it is considered ok.


      var alignOk = (!vAlign || vAlignOk) && (!hAlign || hAlignOk); // Filter out elements that don't match the alignment (if defined).
      // With dynamicAlign, we need to consider all the positions to find the
      // one that minimizes the cropped area.

      if (!this.dynamicAlign && !alignOk) {
        continue;
      }

      candidate.offscreenArea = this.__getOffscreenArea(candidate, size, fitRect); // If not cropped and respects the align requirements, keep it.
      // This allows to prefer positions overlapping horizontally over the
      // ones overlapping vertically.

      if (candidate.offscreenArea === 0 && alignOk) {
        position = candidate;
        break;
      }

      position = position || candidate;
      var diff = candidate.offscreenArea - position.offscreenArea; // Check which crops less. If it crops equally, check if at least one
      // align setting is ok.

      if (diff < 0 || diff === 0 && (vAlignOk || hAlignOk)) {
        position = candidate;
      }
    }

    return position;
  }
};
var ironFitBehavior = {
  IronFitBehavior: IronFitBehavior
}; /// BareSpecifier=@polymer\iron-overlay-behavior\iron-focusables-helper

var p = Element.prototype;
var matches = p.matches || p.matchesSelector || p.mozMatchesSelector || p.msMatchesSelector || p.oMatchesSelector || p.webkitMatchesSelector;
const IronFocusablesHelper = {
  /**
   * Returns a sorted array of tabbable nodes, including the root node.
   * It searches the tabbable nodes in the light and shadow dom of the chidren,
   * sorting the result by tabindex.
   * @param {!Node} node
   * @return {!Array<!HTMLElement>}
   */getTabbableNodes: function (node) {
    var result = []; // If there is at least one element with tabindex > 0, we need to sort
    // the final array by tabindex.

    var needsSortByTabIndex = this._collectTabbableNodes(node, result);

    if (needsSortByTabIndex) {
      return this._sortByTabIndex(result);
    }

    return result;
  },
  /**
   * Returns if a element is focusable.
   * @param {!HTMLElement} element
   * @return {boolean}
   */isFocusable: function (element) {
    // From http://stackoverflow.com/a/1600194/4228703:
    // There isn't a definite list, it's up to the browser. The only
    // standard we have is DOM Level 2 HTML
    // https://www.w3.org/TR/DOM-Level-2-HTML/html.html, according to which the
    // only elements that have a focus() method are HTMLInputElement,
    // HTMLSelectElement, HTMLTextAreaElement and HTMLAnchorElement. This
    // notably omits HTMLButtonElement and HTMLAreaElement. Referring to these
    // tests with tabbables in different browsers
    // http://allyjs.io/data-tables/focusable.html
    // Elements that cannot be focused if they have [disabled] attribute.
    if (matches.call(element, 'input, select, textarea, button, object')) {
      return matches.call(element, ':not([disabled])');
    } // Elements that can be focused even if they have [disabled] attribute.


    return matches.call(element, 'a[href], area[href], iframe, [tabindex], [contentEditable]');
  },
  /**
   * Returns if a element is tabbable. To be tabbable, a element must be
   * focusable, visible, and with a tabindex !== -1.
   * @param {!HTMLElement} element
   * @return {boolean}
   */isTabbable: function (element) {
    return this.isFocusable(element) && matches.call(element, ':not([tabindex="-1"])') && this._isVisible(element);
  },
  /**
   * Returns the normalized element tabindex. If not focusable, returns -1.
   * It checks for the attribute "tabindex" instead of the element property
   * `tabIndex` since browsers assign different values to it.
   * e.g. in Firefox `<div contenteditable>` has `tabIndex = -1`
   * @param {!HTMLElement} element
   * @return {!number}
   * @private
   */_normalizedTabIndex: function (element) {
    if (this.isFocusable(element)) {
      var tabIndex = element.getAttribute('tabindex') || 0;
      return Number(tabIndex);
    }

    return -1;
  },
  /**
   * Searches for nodes that are tabbable and adds them to the `result` array.
   * Returns if the `result` array needs to be sorted by tabindex.
   * @param {!Node} node The starting point for the search; added to `result`
   * if tabbable.
   * @param {!Array<!HTMLElement>} result
   * @return {boolean}
   * @private
   */_collectTabbableNodes: function (node, result) {
    // If not an element or not visible, no need to explore children.
    if (node.nodeType !== Node.ELEMENT_NODE || !this._isVisible(node)) {
      return false;
    }

    var element = /** @type {!HTMLElement} */node;

    var tabIndex = this._normalizedTabIndex(element);

    var needsSort = tabIndex > 0;

    if (tabIndex >= 0) {
      result.push(element);
    } // In ShadowDOM v1, tab order is affected by the order of distrubution.
    // E.g. getTabbableNodes(#root) in ShadowDOM v1 should return [#A, #B];
    // in ShadowDOM v0 tab order is not affected by the distrubution order,
    // in fact getTabbableNodes(#root) returns [#B, #A].
    //  <div id="root">
    //   <!-- shadow -->
    //     <slot name="a">
    //     <slot name="b">
    //   <!-- /shadow -->
    //   <input id="A" slot="a">
    //   <input id="B" slot="b" tabindex="1">
    //  </div>
    // TODO(valdrin) support ShadowDOM v1 when upgrading to Polymer v2.0.


    var children;

    if (element.localName === 'content' || element.localName === 'slot') {
      children = dom(element).getDistributedNodes();
    } else {
      // Use shadow root if possible, will check for distributed nodes.
      children = dom(element.root || element).children;
    }

    for (var i = 0; i < children.length; i++) {
      // Ensure method is always invoked to collect tabbable children.
      needsSort = this._collectTabbableNodes(children[i], result) || needsSort;
    }

    return needsSort;
  },
  /**
   * Returns false if the element has `visibility: hidden` or `display: none`
   * @param {!HTMLElement} element
   * @return {boolean}
   * @private
   */_isVisible: function (element) {
    // Check inline style first to save a re-flow. If looks good, check also
    // computed style.
    var style = element.style;

    if (style.visibility !== 'hidden' && style.display !== 'none') {
      style = window.getComputedStyle(element);
      return style.visibility !== 'hidden' && style.display !== 'none';
    }

    return false;
  },
  /**
   * Sorts an array of tabbable elements by tabindex. Returns a new array.
   * @param {!Array<!HTMLElement>} tabbables
   * @return {!Array<!HTMLElement>}
   * @private
   */_sortByTabIndex: function (tabbables) {
    // Implement a merge sort as Array.prototype.sort does a non-stable sort
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort
    var len = tabbables.length;

    if (len < 2) {
      return tabbables;
    }

    var pivot = Math.ceil(len / 2);

    var left = this._sortByTabIndex(tabbables.slice(0, pivot));

    var right = this._sortByTabIndex(tabbables.slice(pivot));

    return this._mergeSortByTabIndex(left, right);
  },
  /**
   * Merge sort iterator, merges the two arrays into one, sorted by tab index.
   * @param {!Array<!HTMLElement>} left
   * @param {!Array<!HTMLElement>} right
   * @return {!Array<!HTMLElement>}
   * @private
   */_mergeSortByTabIndex: function (left, right) {
    var result = [];

    while (left.length > 0 && right.length > 0) {
      if (this._hasLowerTabOrder(left[0], right[0])) {
        result.push(right.shift());
      } else {
        result.push(left.shift());
      }
    }

    return result.concat(left, right);
  },
  /**
   * Returns if element `a` has lower tab order compared to element `b`
   * (both elements are assumed to be focusable and tabbable).
   * Elements with tabindex = 0 have lower tab order compared to elements
   * with tabindex > 0.
   * If both have same tabindex, it returns false.
   * @param {!HTMLElement} a
   * @param {!HTMLElement} b
   * @return {boolean}
   * @private
   */_hasLowerTabOrder: function (a, b) {
    // Normalize tabIndexes
    // e.g. in Firefox `<div contenteditable>` has `tabIndex = -1`
    var ati = Math.max(a.tabIndex, 0);
    var bti = Math.max(b.tabIndex, 0);
    return ati === 0 || bti === 0 ? bti > ati : ati > bti;
  }
};
var ironFocusablesHelper = {
  IronFocusablesHelper: IronFocusablesHelper
}; /// BareSpecifier=@polymer\iron-overlay-behavior\iron-overlay-backdrop

Polymer({
  _template: html`
    <style>
      :host {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: var(--iron-overlay-backdrop-background-color, #000);
        opacity: 0;
        transition: opacity 0.2s;
        pointer-events: none;
        @apply --iron-overlay-backdrop;
      }

      :host(.opened) {
        opacity: var(--iron-overlay-backdrop-opacity, 0.6);
        pointer-events: auto;
        @apply --iron-overlay-backdrop-opened;
      }
    </style>

    <slot></slot>
`,
  is: 'iron-overlay-backdrop',
  properties: {
    /**
     * Returns true if the backdrop is opened.
     */opened: {
      reflectToAttribute: true,
      type: Boolean,
      value: false,
      observer: '_openedChanged'
    }
  },
  listeners: {
    'transitionend': '_onTransitionend'
  },
  created: function () {
    // Used to cancel previous requestAnimationFrame calls when opened changes.
    this.__openedRaf = null;
  },
  attached: function () {
    this.opened && this._openedChanged(this.opened);
  },
  /**
   * Appends the backdrop to document body if needed.
   */prepare: function () {
    if (this.opened && !this.parentNode) {
      dom(document.body).appendChild(this);
    }
  },
  /**
   * Shows the backdrop.
   */open: function () {
    this.opened = true;
  },
  /**
   * Hides the backdrop.
   */close: function () {
    this.opened = false;
  },
  /**
   * Removes the backdrop from document body if needed.
   */complete: function () {
    if (!this.opened && this.parentNode === document.body) {
      dom(this.parentNode).removeChild(this);
    }
  },
  _onTransitionend: function (event) {
    if (event && event.target === this) {
      this.complete();
    }
  },
  /**
   * @param {boolean} opened
   * @private
   */_openedChanged: function (opened) {
    if (opened) {
      // Auto-attach.
      this.prepare();
    } else {
      // Animation might be disabled via the mixin or opacity custom property.
      // If it is disabled in other ways, it's up to the user to call complete.
      var cs = window.getComputedStyle(this);

      if (cs.transitionDuration === '0s' || cs.opacity == 0) {
        this.complete();
      }
    }

    if (!this.isAttached) {
      return;
    } // Always cancel previous requestAnimationFrame.


    if (this.__openedRaf) {
      window.cancelAnimationFrame(this.__openedRaf);
      this.__openedRaf = null;
    } // Force relayout to ensure proper transitions.


    this.scrollTop = this.scrollTop;
    this.__openedRaf = window.requestAnimationFrame(function () {
      this.__openedRaf = null;
      this.toggleClass('opened', this.opened);
    }.bind(this));
  }
}); /// BareSpecifier=@polymer\iron-overlay-behavior\iron-overlay-manager

const IronOverlayManagerClass = function () {
  /**
   * Used to keep track of the opened overlays.
   * @private {!Array<!Element>}
   */this._overlays = []; /**
                           * iframes have a default z-index of 100,
                           * so this default should be at least that.
                           * @private {number}
                           */
  this._minimumZ = 101; /**
                         * Memoized backdrop element.
                         * @private {Element|null}
                         */
  this._backdropElement = null; // Enable document-wide tap recognizer.
  // NOTE: Use useCapture=true to avoid accidentally prevention of the closing
  // of an overlay via event.stopPropagation(). The only way to prevent
  // closing of an overlay should be through its APIs.
  // NOTE: enable tap on <html> to workaround Polymer/polymer#4459
  // Pass no-op function because MSEdge 15 doesn't handle null as 2nd argument
  // https://github.com/Microsoft/ChakraCore/issues/3863

  add(document.documentElement, 'tap', function () {});
  document.addEventListener('tap', this._onCaptureClick.bind(this), true);
  document.addEventListener('focus', this._onCaptureFocus.bind(this), true);
  document.addEventListener('keydown', this._onCaptureKeyDown.bind(this), true);
};

IronOverlayManagerClass.prototype = {
  constructor: IronOverlayManagerClass,

  /**
   * The shared backdrop element.
   * @return {!Element} backdropElement
   */get backdropElement() {
    if (!this._backdropElement) {
      this._backdropElement = document.createElement('iron-overlay-backdrop');
    }

    return this._backdropElement;
  },

  /**
   * The deepest active element.
   * @return {!Element} activeElement the active element
   */get deepActiveElement() {
    var active = document.activeElement; // document.activeElement can be null
    // https://developer.mozilla.org/en-US/docs/Web/API/Document/activeElement
    // In IE 11, it can also be an object when operating in iframes.
    // In these cases, default it to document.body.

    if (!active || active instanceof Element === false) {
      active = document.body;
    }

    while (active.root && dom(active.root).activeElement) {
      active = dom(active.root).activeElement;
    }

    return active;
  },

  /**
   * Brings the overlay at the specified index to the front.
   * @param {number} i
   * @private
   */_bringOverlayAtIndexToFront: function (i) {
    var overlay = this._overlays[i];

    if (!overlay) {
      return;
    }

    var lastI = this._overlays.length - 1;
    var currentOverlay = this._overlays[lastI]; // Ensure always-on-top overlay stays on top.

    if (currentOverlay && this._shouldBeBehindOverlay(overlay, currentOverlay)) {
      lastI--;
    } // If already the top element, return.


    if (i >= lastI) {
      return;
    } // Update z-index to be on top.


    var minimumZ = Math.max(this.currentOverlayZ(), this._minimumZ);

    if (this._getZ(overlay) <= minimumZ) {
      this._applyOverlayZ(overlay, minimumZ);
    } // Shift other overlays behind the new on top.


    while (i < lastI) {
      this._overlays[i] = this._overlays[i + 1];
      i++;
    }

    this._overlays[lastI] = overlay;
  },
  /**
   * Adds the overlay and updates its z-index if it's opened, or removes it if
   * it's closed. Also updates the backdrop z-index.
   * @param {!Element} overlay
   */addOrRemoveOverlay: function (overlay) {
    if (overlay.opened) {
      this.addOverlay(overlay);
    } else {
      this.removeOverlay(overlay);
    }
  },
  /**
   * Tracks overlays for z-index and focus management.
   * Ensures the last added overlay with always-on-top remains on top.
   * @param {!Element} overlay
   */addOverlay: function (overlay) {
    var i = this._overlays.indexOf(overlay);

    if (i >= 0) {
      this._bringOverlayAtIndexToFront(i);

      this.trackBackdrop();
      return;
    }

    var insertionIndex = this._overlays.length;
    var currentOverlay = this._overlays[insertionIndex - 1];
    var minimumZ = Math.max(this._getZ(currentOverlay), this._minimumZ);

    var newZ = this._getZ(overlay); // Ensure always-on-top overlay stays on top.


    if (currentOverlay && this._shouldBeBehindOverlay(overlay, currentOverlay)) {
      // This bumps the z-index of +2.
      this._applyOverlayZ(currentOverlay, minimumZ);

      insertionIndex--; // Update minimumZ to match previous overlay's z-index.

      var previousOverlay = this._overlays[insertionIndex - 1];
      minimumZ = Math.max(this._getZ(previousOverlay), this._minimumZ);
    } // Update z-index and insert overlay.


    if (newZ <= minimumZ) {
      this._applyOverlayZ(overlay, minimumZ);
    }

    this._overlays.splice(insertionIndex, 0, overlay);

    this.trackBackdrop();
  },
  /**
   * @param {!Element} overlay
   */removeOverlay: function (overlay) {
    var i = this._overlays.indexOf(overlay);

    if (i === -1) {
      return;
    }

    this._overlays.splice(i, 1);

    this.trackBackdrop();
  },
  /**
   * Returns the current overlay.
   * @return {!Element|undefined}
   */currentOverlay: function () {
    var i = this._overlays.length - 1;
    return this._overlays[i];
  },
  /**
   * Returns the current overlay z-index.
   * @return {number}
   */currentOverlayZ: function () {
    return this._getZ(this.currentOverlay());
  },
  /**
   * Ensures that the minimum z-index of new overlays is at least `minimumZ`.
   * This does not effect the z-index of any existing overlays.
   * @param {number} minimumZ
   */ensureMinimumZ: function (minimumZ) {
    this._minimumZ = Math.max(this._minimumZ, minimumZ);
  },
  focusOverlay: function () {
    var current = /** @type {?} */this.currentOverlay();

    if (current) {
      current._applyFocus();
    }
  },
  /**
   * Updates the backdrop z-index.
   */trackBackdrop: function () {
    var overlay = this._overlayWithBackdrop(); // Avoid creating the backdrop if there is no overlay with backdrop.


    if (!overlay && !this._backdropElement) {
      return;
    }

    this.backdropElement.style.zIndex = this._getZ(overlay) - 1;
    this.backdropElement.opened = !!overlay; // Property observers are not fired until element is attached
    // in Polymer 2.x, so we ensure element is attached if needed.
    // https://github.com/Polymer/polymer/issues/4526

    this.backdropElement.prepare();
  },
  /**
   * @return {!Array<!Element>}
   */getBackdrops: function () {
    var backdrops = [];

    for (var i = 0; i < this._overlays.length; i++) {
      if (this._overlays[i].withBackdrop) {
        backdrops.push(this._overlays[i]);
      }
    }

    return backdrops;
  },
  /**
   * Returns the z-index for the backdrop.
   * @return {number}
   */backdropZ: function () {
    return this._getZ(this._overlayWithBackdrop()) - 1;
  },
  /**
   * Returns the top opened overlay that has a backdrop.
   * @return {!Element|undefined}
   * @private
   */_overlayWithBackdrop: function () {
    for (var i = this._overlays.length - 1; i >= 0; i--) {
      if (this._overlays[i].withBackdrop) {
        return this._overlays[i];
      }
    }
  },
  /**
   * Calculates the minimum z-index for the overlay.
   * @param {Element=} overlay
   * @private
   */_getZ: function (overlay) {
    var z = this._minimumZ;

    if (overlay) {
      var z1 = Number(overlay.style.zIndex || window.getComputedStyle(overlay).zIndex); // Check if is a number
      // Number.isNaN not supported in IE 10+

      if (z1 === z1) {
        z = z1;
      }
    }

    return z;
  },
  /**
   * @param {!Element} element
   * @param {number|string} z
   * @private
   */_setZ: function (element, z) {
    element.style.zIndex = z;
  },
  /**
   * @param {!Element} overlay
   * @param {number} aboveZ
   * @private
   */_applyOverlayZ: function (overlay, aboveZ) {
    this._setZ(overlay, aboveZ + 2);
  },
  /**
   * Returns the deepest overlay in the path.
   * @param {!Array<!Element>=} path
   * @return {!Element|undefined}
   * @suppress {missingProperties}
   * @private
   */_overlayInPath: function (path) {
    path = path || [];

    for (var i = 0; i < path.length; i++) {
      if (path[i]._manager === this) {
        return path[i];
      }
    }
  },
  /**
   * Ensures the click event is delegated to the right overlay.
   * @param {!Event} event
   * @private
   */_onCaptureClick: function (event) {
    var i = this._overlays.length - 1;
    if (i === -1) return;
    var path = /** @type {!Array<!EventTarget>} */dom(event).path;
    var overlay; // Check if clicked outside of overlay.

    while ((overlay = /** @type {?} */this._overlays[i]) && this._overlayInPath(path) !== overlay) {
      overlay._onCaptureClick(event);

      if (overlay.allowClickThrough) {
        i--;
      } else {
        break;
      }
    }
  },
  /**
   * Ensures the focus event is delegated to the right overlay.
   * @param {!Event} event
   * @private
   */_onCaptureFocus: function (event) {
    var overlay = /** @type {?} */this.currentOverlay();

    if (overlay) {
      overlay._onCaptureFocus(event);
    }
  },
  /**
   * Ensures TAB and ESC keyboard events are delegated to the right overlay.
   * @param {!Event} event
   * @private
   */_onCaptureKeyDown: function (event) {
    var overlay = /** @type {?} */this.currentOverlay();

    if (overlay) {
      if (IronA11yKeysBehavior.keyboardEventMatchesKeys(event, 'esc')) {
        overlay._onCaptureEsc(event);
      } else if (IronA11yKeysBehavior.keyboardEventMatchesKeys(event, 'tab')) {
        overlay._onCaptureTab(event);
      }
    }
  },
  /**
   * Returns if the overlay1 should be behind overlay2.
   * @param {!Element} overlay1
   * @param {!Element} overlay2
   * @return {boolean}
   * @suppress {missingProperties}
   * @private
   */_shouldBeBehindOverlay: function (overlay1, overlay2) {
    return !overlay1.alwaysOnTop && overlay2.alwaysOnTop;
  }
};
const IronOverlayManager = new IronOverlayManagerClass();
var ironOverlayManager = {
  IronOverlayManagerClass: IronOverlayManagerClass,
  IronOverlayManager: IronOverlayManager
}; /// BareSpecifier=@polymer\iron-overlay-behavior\iron-scroll-manager

var lastTouchPosition = {
  pageX: 0,
  pageY: 0
}; /**
    * Used to avoid computing event.path and filter scrollable nodes (better perf).
    * @type {?EventTarget}
    */
var lastRootTarget = null; /**
                            * @type {!Array<!Node>}
                            */
var lastScrollableNodes = []; /**
                               * @type {!Array<string>}
                               */
var scrollEvents = [// Modern `wheel` event for mouse wheel scrolling:
'wheel', // Older, non-standard `mousewheel` event for some FF:
'mousewheel', // IE:
'DOMMouseScroll', // Touch enabled devices
'touchstart', 'touchmove']; // must be defined for modulizer

var _boundScrollHandler;

var currentLockingElement; /**
                            * The IronScrollManager is intended to provide a central source
                            * of authority and control over which elements in a document are currently
                            * allowed to scroll.
                            *
                            */
`TODO(modulizer): A namespace named Polymer.IronScrollManager was
declared here. The surrounding comments should be reviewed,
and this string can then be deleted`; /**
                                       * The current element that defines the DOM boundaries of the
                                       * scroll lock. This is always the most recently locking element.
                                       *
                                       * @return {!Node|undefined}
                                       */

function elementIsScrollLocked(element) {
  var lockingElement = currentLockingElement;

  if (lockingElement === undefined) {
    return false;
  }

  var scrollLocked;

  if (_hasCachedLockedElement(element)) {
    return true;
  }

  if (_hasCachedUnlockedElement(element)) {
    return false;
  }

  scrollLocked = !!lockingElement && lockingElement !== element && !_composedTreeContains(lockingElement, element);

  if (scrollLocked) {
    _lockedElementCache.push(element);
  } else {
    _unlockedElementCache.push(element);
  }

  return scrollLocked;
} /**
   * Push an element onto the current scroll lock stack. The most recently
   * pushed element and its children will be considered scrollable. All
   * other elements will not be scrollable.
   *
   * Scroll locking is implemented as a stack so that cases such as
   * dropdowns within dropdowns are handled well.
   *
   * @param {!HTMLElement} element The element that should lock scroll.
   */

function pushScrollLock(element) {
  // Prevent pushing the same element twice
  if (_lockingElements.indexOf(element) >= 0) {
    return;
  }

  if (_lockingElements.length === 0) {
    _lockScrollInteractions();
  }

  _lockingElements.push(element);

  currentLockingElement = _lockingElements[_lockingElements.length - 1];
  _lockedElementCache = [];
  _unlockedElementCache = [];
} /**
   * Remove an element from the scroll lock stack. The element being
   * removed does not need to be the most recently pushed element. However,
   * the scroll lock constraints only change when the most recently pushed
   * element is removed.
   *
   * @param {!HTMLElement} element The element to remove from the scroll
   * lock stack.
   */

function removeScrollLock(element) {
  var index = _lockingElements.indexOf(element);

  if (index === -1) {
    return;
  }

  _lockingElements.splice(index, 1);

  currentLockingElement = _lockingElements[_lockingElements.length - 1];
  _lockedElementCache = [];
  _unlockedElementCache = [];

  if (_lockingElements.length === 0) {
    _unlockScrollInteractions();
  }
}

const _lockingElements = [];
let _lockedElementCache = null;
let _unlockedElementCache = null;

function _hasCachedLockedElement(element) {
  return _lockedElementCache.indexOf(element) > -1;
}

function _hasCachedUnlockedElement(element) {
  return _unlockedElementCache.indexOf(element) > -1;
}

function _composedTreeContains(element, child) {
  // NOTE(cdata): This method iterates over content elements and their
  // corresponding distributed nodes to implement a contains-like method
  // that pierces through the composed tree of the ShadowDOM. Results of
  // this operation are cached (elsewhere) on a per-scroll-lock basis, to
  // guard against potentially expensive lookups happening repeatedly as
  // a user scrolls / touchmoves.
  var contentElements;
  var distributedNodes;
  var contentIndex;
  var nodeIndex;

  if (element.contains(child)) {
    return true;
  }

  contentElements = dom(element).querySelectorAll('content,slot');

  for (contentIndex = 0; contentIndex < contentElements.length; ++contentIndex) {
    distributedNodes = dom(contentElements[contentIndex]).getDistributedNodes();

    for (nodeIndex = 0; nodeIndex < distributedNodes.length; ++nodeIndex) {
      // Polymer 2.x returns slot.assignedNodes which can contain text nodes.
      if (distributedNodes[nodeIndex].nodeType !== Node.ELEMENT_NODE) continue;

      if (_composedTreeContains(distributedNodes[nodeIndex], child)) {
        return true;
      }
    }
  }

  return false;
}

function _scrollInteractionHandler(event) {
  // Avoid canceling an event with cancelable=false, e.g. scrolling is in
  // progress and cannot be interrupted.
  if (event.cancelable && _shouldPreventScrolling(event)) {
    event.preventDefault();
  } // If event has targetTouches (touch event), update last touch position.


  if (event.targetTouches) {
    var touch = event.targetTouches[0];
    lastTouchPosition.pageX = touch.pageX;
    lastTouchPosition.pageY = touch.pageY;
  }
} /**
   * @private
   */

function _lockScrollInteractions() {
  _boundScrollHandler = _boundScrollHandler || _scrollInteractionHandler.bind(undefined);

  for (var i = 0, l = scrollEvents.length; i < l; i++) {
    // NOTE: browsers that don't support objects as third arg will
    // interpret it as boolean, hence useCapture = true in this case.
    document.addEventListener(scrollEvents[i], _boundScrollHandler, {
      capture: true,
      passive: false
    });
  }
}

function _unlockScrollInteractions() {
  for (var i = 0, l = scrollEvents.length; i < l; i++) {
    // NOTE: browsers that don't support objects as third arg will
    // interpret it as boolean, hence useCapture = true in this case.
    document.removeEventListener(scrollEvents[i], _boundScrollHandler, {
      capture: true,
      passive: false
    });
  }
} /**
   * Returns true if the event causes scroll outside the current locking
   * element, e.g. pointer/keyboard interactions, or scroll "leaking"
   * outside the locking element when it is already at its scroll boundaries.
   * @param {!Event} event
   * @return {boolean}
   * @private
   */

function _shouldPreventScrolling(event) {
  // Update if root target changed. For touch events, ensure we don't
  // update during touchmove.
  var target = dom(event).rootTarget;

  if (event.type !== 'touchmove' && lastRootTarget !== target) {
    lastRootTarget = target;
    lastScrollableNodes = _getScrollableNodes(dom(event).path);
  } // Prevent event if no scrollable nodes.


  if (!lastScrollableNodes.length) {
    return true;
  } // Don't prevent touchstart event inside the locking element when it has
  // scrollable nodes.


  if (event.type === 'touchstart') {
    return false;
  } // Get deltaX/Y.


  var info = _getScrollInfo(event); // Prevent if there is no child that can scroll.


  return !_getScrollingNode(lastScrollableNodes, info.deltaX, info.deltaY);
} /**
   * Returns an array of scrollable nodes up to the current locking element,
   * which is included too if scrollable.
   * @param {!Array<!Node>} nodes
   * @return {!Array<!Node>} scrollables
   * @private
   */

function _getScrollableNodes(nodes) {
  var scrollables = [];
  var lockingIndex = nodes.indexOf(currentLockingElement); // Loop from root target to locking element (included).

  for (var i = 0; i <= lockingIndex; i++) {
    // Skip non-Element nodes.
    if (nodes[i].nodeType !== Node.ELEMENT_NODE) {
      continue;
    }

    var node = /** @type {!Element} */nodes[i]; // Check inline style before checking computed style.

    var style = node.style;

    if (style.overflow !== 'scroll' && style.overflow !== 'auto') {
      style = window.getComputedStyle(node);
    }

    if (style.overflow === 'scroll' || style.overflow === 'auto') {
      scrollables.push(node);
    }
  }

  return scrollables;
} /**
   * Returns the node that is scrolling. If there is no scrolling,
   * returns undefined.
   * @param {!Array<!Node>} nodes
   * @param {number} deltaX Scroll delta on the x-axis
   * @param {number} deltaY Scroll delta on the y-axis
   * @return {!Node|undefined}
   * @private
   */

function _getScrollingNode(nodes, deltaX, deltaY) {
  // No scroll.
  if (!deltaX && !deltaY) {
    return;
  } // Check only one axis according to where there is more scroll.
  // Prefer vertical to horizontal.


  var verticalScroll = Math.abs(deltaY) >= Math.abs(deltaX);

  for (var i = 0; i < nodes.length; i++) {
    var node = nodes[i];
    var canScroll = false;

    if (verticalScroll) {
      // delta < 0 is scroll up, delta > 0 is scroll down.
      canScroll = deltaY < 0 ? node.scrollTop > 0 : node.scrollTop < node.scrollHeight - node.clientHeight;
    } else {
      // delta < 0 is scroll left, delta > 0 is scroll right.
      canScroll = deltaX < 0 ? node.scrollLeft > 0 : node.scrollLeft < node.scrollWidth - node.clientWidth;
    }

    if (canScroll) {
      return node;
    }
  }
} /**
   * Returns scroll `deltaX` and `deltaY`.
   * @param {!Event} event The scroll event
   * @return {{deltaX: number, deltaY: number}} Object containing the
   * x-axis scroll delta (positive: scroll right, negative: scroll left,
   * 0: no scroll), and the y-axis scroll delta (positive: scroll down,
   * negative: scroll up, 0: no scroll).
   * @private
   */

function _getScrollInfo(event) {
  var info = {
    deltaX: event.deltaX,
    deltaY: event.deltaY
  }; // Already available.

  if ('deltaX' in event) {} // do nothing, values are already good.
  // Safari has scroll info in `wheelDeltaX/Y`.
  else if ('wheelDeltaX' in event && 'wheelDeltaY' in event) {
      info.deltaX = -event.wheelDeltaX;
      info.deltaY = -event.wheelDeltaY;
    } // IE10 has only vertical scroll info in `wheelDelta`.
    else if ('wheelDelta' in event) {
        info.deltaX = 0;
        info.deltaY = -event.wheelDelta;
      } // Firefox has scroll info in `detail` and `axis`.
      else if ('axis' in event) {
          info.deltaX = event.axis === 1 ? event.detail : 0;
          info.deltaY = event.axis === 2 ? event.detail : 0;
        } // On mobile devices, calculate scroll direction.
        else if (event.targetTouches) {
            var touch = event.targetTouches[0]; // Touch moves from right to left => scrolling goes right.

            info.deltaX = lastTouchPosition.pageX - touch.pageX; // Touch moves from down to up => scrolling goes down.

            info.deltaY = lastTouchPosition.pageY - touch.pageY;
          }

  return info;
}

var ironScrollManager = {
  get currentLockingElement() {
    return currentLockingElement;
  },

  elementIsScrollLocked: elementIsScrollLocked,
  pushScrollLock: pushScrollLock,
  removeScrollLock: removeScrollLock,
  _lockingElements: _lockingElements,

  get _lockedElementCache() {
    return _lockedElementCache;
  },

  get _unlockedElementCache() {
    return _unlockedElementCache;
  },

  _hasCachedLockedElement: _hasCachedLockedElement,
  _hasCachedUnlockedElement: _hasCachedUnlockedElement,
  _composedTreeContains: _composedTreeContains,
  _scrollInteractionHandler: _scrollInteractionHandler,

  get _boundScrollHandler() {
    return _boundScrollHandler;
  },

  _lockScrollInteractions: _lockScrollInteractions,
  _unlockScrollInteractions: _unlockScrollInteractions,
  _shouldPreventScrolling: _shouldPreventScrolling,
  _getScrollableNodes: _getScrollableNodes,
  _getScrollingNode: _getScrollingNode,
  _getScrollInfo: _getScrollInfo
}; /// BareSpecifier=@polymer\iron-overlay-behavior\iron-overlay-behavior

const IronOverlayBehaviorImpl = {
  properties: {
    /**
     * True if the overlay is currently displayed.
     */opened: {
      observer: '_openedChanged',
      type: Boolean,
      value: false,
      notify: true
    },
    /**
     * True if the overlay was canceled when it was last closed.
     */canceled: {
      observer: '_canceledChanged',
      readOnly: true,
      type: Boolean,
      value: false
    },
    /**
     * Set to true to display a backdrop behind the overlay. It traps the focus
     * within the light DOM of the overlay.
     */withBackdrop: {
      observer: '_withBackdropChanged',
      type: Boolean
    },
    /**
     * Set to true to disable auto-focusing the overlay or child nodes with
     * the `autofocus` attribute` when the overlay is opened.
     */noAutoFocus: {
      type: Boolean,
      value: false
    },
    /**
     * Set to true to disable canceling the overlay with the ESC key.
     */noCancelOnEscKey: {
      type: Boolean,
      value: false
    },
    /**
     * Set to true to disable canceling the overlay by clicking outside it.
     */noCancelOnOutsideClick: {
      type: Boolean,
      value: false
    },
    /**
     * Contains the reason(s) this overlay was last closed (see
     * `iron-overlay-closed`). `IronOverlayBehavior` provides the `canceled`
     * reason; implementers of the behavior can provide other reasons in
     * addition to `canceled`.
     */closingReason: {
      // was a getter before, but needs to be a property so other
      // behaviors can override this.
      type: Object
    },
    /**
     * Set to true to enable restoring of focus when overlay is closed.
     */restoreFocusOnClose: {
      type: Boolean,
      value: false
    },
    /**
     * Set to true to allow clicks to go through overlays.
     * When the user clicks outside this overlay, the click may
     * close the overlay below.
     */allowClickThrough: {
      type: Boolean
    },
    /**
     * Set to true to keep overlay always on top.
     */alwaysOnTop: {
      type: Boolean
    },
    /**
     * Determines which action to perform when scroll outside an opened overlay
     * happens. Possible values: lock - blocks scrolling from happening, refit -
     * computes the new position on the overlay cancel - causes the overlay to
     * close
     */scrollAction: {
      type: String
    },
    /**
     * Shortcut to access to the overlay manager.
     * @private
     * @type {!IronOverlayManagerClass}
     */_manager: {
      type: Object,
      value: IronOverlayManager
    },
    /**
     * The node being focused.
     * @type {?Node}
     */_focusedChild: {
      type: Object
    }
  },
  listeners: {
    'iron-resize': '_onIronResize'
  },
  observers: ['__updateScrollObservers(isAttached, opened, scrollAction)'],

  /**
   * The backdrop element.
   * @return {!Element}
   */get backdropElement() {
    return this._manager.backdropElement;
  },

  /**
   * Returns the node to give focus to.
   * @return {!Node}
   */get _focusNode() {
    return this._focusedChild || dom(this).querySelector('[autofocus]') || this;
  },

  /**
   * Array of nodes that can receive focus (overlay included), ordered by
   * `tabindex`. This is used to retrieve which is the first and last focusable
   * nodes in order to wrap the focus for overlays `with-backdrop`.
   *
   * If you know what is your content (specifically the first and last focusable
   * children), you can override this method to return only `[firstFocusable,
   * lastFocusable];`
   * @return {!Array<!Node>}
   * @protected
   */get _focusableNodes() {
    return IronFocusablesHelper.getTabbableNodes(this);
  },

  /**
   * @return {void}
   */ready: function () {
    // Used to skip calls to notifyResize and refit while the overlay is
    // animating.
    this.__isAnimating = false; // with-backdrop needs tabindex to be set in order to trap the focus.
    // If it is not set, IronOverlayBehavior will set it, and remove it if
    // with-backdrop = false.

    this.__shouldRemoveTabIndex = false; // Used for wrapping the focus on TAB / Shift+TAB.

    this.__firstFocusableNode = this.__lastFocusableNode = null; // Used by to keep track of the RAF callbacks.

    this.__rafs = {}; // Focused node before overlay gets opened. Can be restored on close.

    this.__restoreFocusNode = null; // Scroll info to be restored.

    this.__scrollTop = this.__scrollLeft = null;
    this.__onCaptureScroll = this.__onCaptureScroll.bind(this); // Root nodes hosting the overlay, used to listen for scroll events on them.

    this.__rootNodes = null;

    this._ensureSetup();
  },
  attached: function () {
    // Call _openedChanged here so that position can be computed correctly.
    if (this.opened) {
      this._openedChanged(this.opened);
    }

    this._observer = dom(this).observeNodes(this._onNodesChange);
  },
  detached: function () {
    dom(this).unobserveNodes(this._observer);
    this._observer = null;

    for (var cb in this.__rafs) {
      if (this.__rafs[cb] !== null) {
        cancelAnimationFrame(this.__rafs[cb]);
      }
    }

    this.__rafs = {};

    this._manager.removeOverlay(this); // We got detached while animating, ensure we show/hide the overlay
    // and fire iron-overlay-opened/closed event!


    if (this.__isAnimating) {
      if (this.opened) {
        this._finishRenderOpened();
      } else {
        // Restore the focus if necessary.
        this._applyFocus();

        this._finishRenderClosed();
      }
    }
  },
  /**
   * Toggle the opened state of the overlay.
   */toggle: function () {
    this._setCanceled(false);

    this.opened = !this.opened;
  },
  /**
   * Open the overlay.
   */open: function () {
    this._setCanceled(false);

    this.opened = true;
  },
  /**
   * Close the overlay.
   */close: function () {
    this._setCanceled(false);

    this.opened = false;
  },
  /**
   * Cancels the overlay.
   * @param {Event=} event The original event
   */cancel: function (event) {
    var cancelEvent = this.fire('iron-overlay-canceled', event, {
      cancelable: true
    });

    if (cancelEvent.defaultPrevented) {
      return;
    }

    this._setCanceled(true);

    this.opened = false;
  },
  /**
   * Invalidates the cached tabbable nodes. To be called when any of the
   * focusable content changes (e.g. a button is disabled).
   */invalidateTabbables: function () {
    this.__firstFocusableNode = this.__lastFocusableNode = null;
  },
  _ensureSetup: function () {
    if (this._overlaySetup) {
      return;
    }

    this._overlaySetup = true;
    this.style.outline = 'none';
    this.style.display = 'none';
  },
  /**
   * Called when `opened` changes.
   * @param {boolean=} opened
   * @protected
   */_openedChanged: function (opened) {
    if (opened) {
      this.removeAttribute('aria-hidden');
    } else {
      this.setAttribute('aria-hidden', 'true');
    } // Defer any animation-related code on attached
    // (_openedChanged gets called again on attached).


    if (!this.isAttached) {
      return;
    }

    this.__isAnimating = true; // Deraf for non-blocking rendering.

    this.__deraf('__openedChanged', this.__openedChanged);
  },
  _canceledChanged: function () {
    this.closingReason = this.closingReason || {};
    this.closingReason.canceled = this.canceled;
  },
  _withBackdropChanged: function () {
    // If tabindex is already set, no need to override it.
    if (this.withBackdrop && !this.hasAttribute('tabindex')) {
      this.setAttribute('tabindex', '-1');
      this.__shouldRemoveTabIndex = true;
    } else if (this.__shouldRemoveTabIndex) {
      this.removeAttribute('tabindex');
      this.__shouldRemoveTabIndex = false;
    }

    if (this.opened && this.isAttached) {
      this._manager.trackBackdrop();
    }
  },
  /**
   * tasks which must occur before opening; e.g. making the element visible.
   * @protected
   */_prepareRenderOpened: function () {
    // Store focused node.
    this.__restoreFocusNode = this._manager.deepActiveElement; // Needed to calculate the size of the overlay so that transitions on its
    // size will have the correct starting points.

    this._preparePositioning();

    this.refit();

    this._finishPositioning(); // Safari will apply the focus to the autofocus element when displayed
    // for the first time, so we make sure to return the focus where it was.


    if (this.noAutoFocus && document.activeElement === this._focusNode) {
      this._focusNode.blur();

      this.__restoreFocusNode.focus();
    }
  },
  /**
   * Tasks which cause the overlay to actually open; typically play an
   * animation.
   * @protected
   */_renderOpened: function () {
    this._finishRenderOpened();
  },
  /**
   * Tasks which cause the overlay to actually close; typically play an
   * animation.
   * @protected
   */_renderClosed: function () {
    this._finishRenderClosed();
  },
  /**
   * Tasks to be performed at the end of open action. Will fire
   * `iron-overlay-opened`.
   * @protected
   */_finishRenderOpened: function () {
    this.notifyResize();
    this.__isAnimating = false;
    this.fire('iron-overlay-opened');
  },
  /**
   * Tasks to be performed at the end of close action. Will fire
   * `iron-overlay-closed`.
   * @protected
   */_finishRenderClosed: function () {
    // Hide the overlay.
    this.style.display = 'none'; // Reset z-index only at the end of the animation.

    this.style.zIndex = '';
    this.notifyResize();
    this.__isAnimating = false;
    this.fire('iron-overlay-closed', this.closingReason);
  },
  _preparePositioning: function () {
    this.style.transition = this.style.webkitTransition = 'none';
    this.style.transform = this.style.webkitTransform = 'none';
    this.style.display = '';
  },
  _finishPositioning: function () {
    // First, make it invisible & reactivate animations.
    this.style.display = 'none'; // Force reflow before re-enabling animations so that they don't start.
    // Set scrollTop to itself so that Closure Compiler doesn't remove this.

    this.scrollTop = this.scrollTop;
    this.style.transition = this.style.webkitTransition = '';
    this.style.transform = this.style.webkitTransform = ''; // Now that animations are enabled, make it visible again

    this.style.display = ''; // Force reflow, so that following animations are properly started.
    // Set scrollTop to itself so that Closure Compiler doesn't remove this.

    this.scrollTop = this.scrollTop;
  },
  /**
   * Applies focus according to the opened state.
   * @protected
   */_applyFocus: function () {
    if (this.opened) {
      if (!this.noAutoFocus) {
        this._focusNode.focus();
      }
    } else {
      // Restore focus.
      if (this.restoreFocusOnClose && this.__restoreFocusNode) {
        // If the activeElement is `<body>` or inside the overlay,
        // we are allowed to restore the focus. In all the other
        // cases focus might have been moved elsewhere by another
        // component or by an user interaction (e.g. click on a
        // button outside the overlay).
        var activeElement = this._manager.deepActiveElement;

        if (activeElement === document.body || dom(this).deepContains(activeElement)) {
          this.__restoreFocusNode.focus();
        }
      }

      this.__restoreFocusNode = null;

      this._focusNode.blur();

      this._focusedChild = null;
    }
  },
  /**
   * Cancels (closes) the overlay. Call when click happens outside the overlay.
   * @param {!Event} event
   * @protected
   */_onCaptureClick: function (event) {
    if (!this.noCancelOnOutsideClick) {
      this.cancel(event);
    }
  },
  /**
   * Keeps track of the focused child. If withBackdrop, traps focus within
   * overlay.
   * @param {!Event} event
   * @protected
   */_onCaptureFocus: function (event) {
    if (!this.withBackdrop) {
      return;
    }

    var path = dom(event).path;

    if (path.indexOf(this) === -1) {
      event.stopPropagation();

      this._applyFocus();
    } else {
      this._focusedChild = path[0];
    }
  },
  /**
   * Handles the ESC key event and cancels (closes) the overlay.
   * @param {!Event} event
   * @protected
   */_onCaptureEsc: function (event) {
    if (!this.noCancelOnEscKey) {
      this.cancel(event);
    }
  },
  /**
   * Handles TAB key events to track focus changes.
   * Will wrap focus for overlays withBackdrop.
   * @param {!Event} event
   * @protected
   */_onCaptureTab: function (event) {
    if (!this.withBackdrop) {
      return;
    }

    this.__ensureFirstLastFocusables(); // TAB wraps from last to first focusable.
    // Shift + TAB wraps from first to last focusable.


    var shift = event.shiftKey;
    var nodeToCheck = shift ? this.__firstFocusableNode : this.__lastFocusableNode;
    var nodeToSet = shift ? this.__lastFocusableNode : this.__firstFocusableNode;
    var shouldWrap = false;

    if (nodeToCheck === nodeToSet) {
      // If nodeToCheck is the same as nodeToSet, it means we have an overlay
      // with 0 or 1 focusables; in either case we still need to trap the
      // focus within the overlay.
      shouldWrap = true;
    } else {
      // In dom=shadow, the manager will receive focus changes on the main
      // root but not the ones within other shadow roots, so we can't rely on
      // _focusedChild, but we should check the deepest active element.
      var focusedNode = this._manager.deepActiveElement; // If the active element is not the nodeToCheck but the overlay itself,
      // it means the focus is about to go outside the overlay, hence we
      // should prevent that (e.g. user opens the overlay and hit Shift+TAB).

      shouldWrap = focusedNode === nodeToCheck || focusedNode === this;
    }

    if (shouldWrap) {
      // When the overlay contains the last focusable element of the document
      // and it's already focused, pressing TAB would move the focus outside
      // the document (e.g. to the browser search bar). Similarly, when the
      // overlay contains the first focusable element of the document and it's
      // already focused, pressing Shift+TAB would move the focus outside the
      // document (e.g. to the browser search bar).
      // In both cases, we would not receive a focus event, but only a blur.
      // In order to achieve focus wrapping, we prevent this TAB event and
      // force the focus. This will also prevent the focus to temporarily move
      // outside the overlay, which might cause scrolling.
      event.preventDefault();
      this._focusedChild = nodeToSet;

      this._applyFocus();
    }
  },
  /**
   * Refits if the overlay is opened and not animating.
   * @protected
   */_onIronResize: function () {
    if (this.opened && !this.__isAnimating) {
      this.__deraf('refit', this.refit);
    }
  },
  /**
   * Will call notifyResize if overlay is opened.
   * Can be overridden in order to avoid multiple observers on the same node.
   * @protected
   */_onNodesChange: function () {
    if (this.opened && !this.__isAnimating) {
      // It might have added focusable nodes, so invalidate cached values.
      this.invalidateTabbables();
      this.notifyResize();
    }
  },
  /**
   * Updates the references to the first and last focusable nodes.
   * @private
   */__ensureFirstLastFocusables: function () {
    var focusableNodes = this._focusableNodes;
    this.__firstFocusableNode = focusableNodes[0];
    this.__lastFocusableNode = focusableNodes[focusableNodes.length - 1];
  },
  /**
   * Tasks executed when opened changes: prepare for the opening, move the
   * focus, update the manager, render opened/closed.
   * @private
   */__openedChanged: function () {
    if (this.opened) {
      // Make overlay visible, then add it to the manager.
      this._prepareRenderOpened();

      this._manager.addOverlay(this); // Move the focus to the child node with [autofocus].


      this._applyFocus();

      this._renderOpened();
    } else {
      // Remove overlay, then restore the focus before actually closing.
      this._manager.removeOverlay(this);

      this._applyFocus();

      this._renderClosed();
    }
  },
  /**
   * Debounces the execution of a callback to the next animation frame.
   * @param {!string} jobname
   * @param {!Function} callback Always bound to `this`
   * @private
   */__deraf: function (jobname, callback) {
    var rafs = this.__rafs;

    if (rafs[jobname] !== null) {
      cancelAnimationFrame(rafs[jobname]);
    }

    rafs[jobname] = requestAnimationFrame(function nextAnimationFrame() {
      rafs[jobname] = null;
      callback.call(this);
    }.bind(this));
  },
  /**
   * @param {boolean} isAttached
   * @param {boolean} opened
   * @param {string=} scrollAction
   * @private
   */__updateScrollObservers: function (isAttached, opened, scrollAction) {
    if (!isAttached || !opened || !this.__isValidScrollAction(scrollAction)) {
      removeScrollLock(this);

      this.__removeScrollListeners();
    } else {
      if (scrollAction === 'lock') {
        this.__saveScrollPosition();

        pushScrollLock(this);
      }

      this.__addScrollListeners();
    }
  },
  /**
   * @private
   */__addScrollListeners: function () {
    if (!this.__rootNodes) {
      this.__rootNodes = []; // Listen for scroll events in all shadowRoots hosting this overlay only
      // when in native ShadowDOM.

      if (useShadow) {
        var node = this;

        while (node) {
          if (node.nodeType === Node.DOCUMENT_FRAGMENT_NODE && node.host) {
            this.__rootNodes.push(node);
          }

          node = node.host || node.assignedSlot || node.parentNode;
        }
      }

      this.__rootNodes.push(document);
    }

    this.__rootNodes.forEach(function (el) {
      el.addEventListener('scroll', this.__onCaptureScroll, {
        capture: true,
        passive: true
      });
    }, this);
  },
  /**
   * @private
   */__removeScrollListeners: function () {
    if (this.__rootNodes) {
      this.__rootNodes.forEach(function (el) {
        el.removeEventListener('scroll', this.__onCaptureScroll, {
          capture: true,
          passive: true
        });
      }, this);
    }

    if (!this.isAttached) {
      this.__rootNodes = null;
    }
  },
  /**
   * @param {string=} scrollAction
   * @return {boolean}
   * @private
   */__isValidScrollAction: function (scrollAction) {
    return scrollAction === 'lock' || scrollAction === 'refit' || scrollAction === 'cancel';
  },
  /**
   * @private
   */__onCaptureScroll: function (event) {
    if (this.__isAnimating) {
      return;
    } // Check if scroll outside the overlay.


    if (dom(event).path.indexOf(this) >= 0) {
      return;
    }

    switch (this.scrollAction) {
      case 'lock':
        // NOTE: scrolling might happen if a scroll event is not cancellable, or
        // if user pressed keys that cause scrolling (they're not prevented in
        // order not to break a11y features like navigate with arrow keys).
        this.__restoreScrollPosition();

        break;

      case 'refit':
        this.__deraf('refit', this.refit);

        break;

      case 'cancel':
        this.cancel(event);
        break;
    }
  },
  /**
   * Memoizes the scroll position of the outside scrolling element.
   * @private
   */__saveScrollPosition: function () {
    if (document.scrollingElement) {
      this.__scrollTop = document.scrollingElement.scrollTop;
      this.__scrollLeft = document.scrollingElement.scrollLeft;
    } else {
      // Since we don't know if is the body or html, get max.
      this.__scrollTop = Math.max(document.documentElement.scrollTop, document.body.scrollTop);
      this.__scrollLeft = Math.max(document.documentElement.scrollLeft, document.body.scrollLeft);
    }
  },
  /**
   * Resets the scroll position of the outside scrolling element.
   * @private
   */__restoreScrollPosition: function () {
    if (document.scrollingElement) {
      document.scrollingElement.scrollTop = this.__scrollTop;
      document.scrollingElement.scrollLeft = this.__scrollLeft;
    } else {
      // Since we don't know if is the body or html, set both.
      document.documentElement.scrollTop = document.body.scrollTop = this.__scrollTop;
      document.documentElement.scrollLeft = document.body.scrollLeft = this.__scrollLeft;
    }
  }
}; /**
     Use `Polymer.IronOverlayBehavior` to implement an element that can be hidden
     or shown, and displays on top of other content. It includes an optional
     backdrop, and can be used to implement a variety of UI controls including
     dialogs and drop downs. Multiple overlays may be displayed at once.
   
     See the [demo source
     code](https://github.com/PolymerElements/iron-overlay-behavior/blob/master/demo/simple-overlay.html)
     for an example.
   
     ### Closing and canceling
   
     An overlay may be hidden by closing or canceling. The difference between close
     and cancel is user intent. Closing generally implies that the user
     acknowledged the content on the overlay. By default, it will cancel whenever
     the user taps outside it or presses the escape key. This behavior is
     configurable with the `no-cancel-on-esc-key` and the
     `no-cancel-on-outside-click` properties. `close()` should be called explicitly
     by the implementer when the user interacts with a control in the overlay
     element. When the dialog is canceled, the overlay fires an
     'iron-overlay-canceled' event. Call `preventDefault` on this event to prevent
     the overlay from closing.
   
     ### Positioning
   
     By default the element is sized and positioned to fit and centered inside the
     window. You can position and size it manually using CSS. See
     `Polymer.IronFitBehavior`.
   
     ### Backdrop
   
     Set the `with-backdrop` attribute to display a backdrop behind the overlay.
     The backdrop is appended to `<body>` and is of type `<iron-overlay-backdrop>`.
     See its doc page for styling options.
   
     In addition, `with-backdrop` will wrap the focus within the content in the
     light DOM. Override the [`_focusableNodes`
     getter](#Polymer.IronOverlayBehavior:property-_focusableNodes) to achieve a
     different behavior.
   
     ### Limitations
   
     The element is styled to appear on top of other content by setting its
     `z-index` property. You must ensure no element has a stacking context with a
     higher `z-index` than its parent stacking context. You should place this
     element as a child of `<body>` whenever possible.
   
     @demo demo/index.html
     @polymerBehavior
    */
const IronOverlayBehavior = [IronFitBehavior, IronResizableBehavior, IronOverlayBehaviorImpl]; /**
                                                                                                       * Fired after the overlay opens.
                                                                                                       * @event iron-overlay-opened
                                                                                                       */ /**
                                                                                                           * Fired when the overlay is canceled, but before it is closed.
                                                                                                           * @event iron-overlay-canceled
                                                                                                           * @param {Event} event The closing of the overlay can be prevented
                                                                                                           * by calling `event.preventDefault()`. The `event.detail` is the original event
                                                                                                           * that originated the canceling (e.g. ESC keyboard event or click event outside
                                                                                                           * the overlay).
                                                                                                           */ /**
                                                                                                               * Fired after the overlay closes.
                                                                                                               * @event iron-overlay-closed
                                                                                                               * @param {Event} event The `event.detail` is the `closingReason` property
                                                                                                               * (contains `canceled`, whether the overlay was canceled).
                                                                                                               */
var ironOverlayBehavior = {
  IronOverlayBehaviorImpl: IronOverlayBehaviorImpl,
  IronOverlayBehavior: IronOverlayBehavior
}; /// BareSpecifier=@polymer\neon-animation\neon-animatable-behavior

const NeonAnimatableBehavior = {
  properties: {
    /**
     * Animation configuration. See README for more info.
     */animationConfig: {
      type: Object
    },
    /**
     * Convenience property for setting an 'entry' animation. Do not set
     * `animationConfig.entry` manually if using this. The animated node is set
     * to `this` if using this property.
     */entryAnimation: {
      observer: '_entryAnimationChanged',
      type: String
    },
    /**
     * Convenience property for setting an 'exit' animation. Do not set
     * `animationConfig.exit` manually if using this. The animated node is set
     * to `this` if using this property.
     */exitAnimation: {
      observer: '_exitAnimationChanged',
      type: String
    }
  },
  _entryAnimationChanged: function () {
    this.animationConfig = this.animationConfig || {};
    this.animationConfig['entry'] = [{
      name: this.entryAnimation,
      node: this
    }];
  },
  _exitAnimationChanged: function () {
    this.animationConfig = this.animationConfig || {};
    this.animationConfig['exit'] = [{
      name: this.exitAnimation,
      node: this
    }];
  },
  _copyProperties: function (config1, config2) {
    // shallowly copy properties from config2 to config1
    for (var property in config2) {
      config1[property] = config2[property];
    }
  },
  _cloneConfig: function (config) {
    var clone = {
      isClone: true
    };

    this._copyProperties(clone, config);

    return clone;
  },
  _getAnimationConfigRecursive: function (type, map, allConfigs) {
    if (!this.animationConfig) {
      return;
    }

    if (this.animationConfig.value && typeof this.animationConfig.value === 'function') {
      this._warn(this._logf('playAnimation', 'Please put \'animationConfig\' inside of your components \'properties\' object instead of outside of it.'));

      return;
    } // type is optional


    var thisConfig;

    if (type) {
      thisConfig = this.animationConfig[type];
    } else {
      thisConfig = this.animationConfig;
    }

    if (!Array.isArray(thisConfig)) {
      thisConfig = [thisConfig];
    } // iterate animations and recurse to process configurations from child nodes


    if (thisConfig) {
      for (var config, index = 0; config = thisConfig[index]; index++) {
        if (config.animatable) {
          config.animatable._getAnimationConfigRecursive(config.type || type, map, allConfigs);
        } else {
          if (config.id) {
            var cachedConfig = map[config.id];

            if (cachedConfig) {
              // merge configurations with the same id, making a clone lazily
              if (!cachedConfig.isClone) {
                map[config.id] = this._cloneConfig(cachedConfig);
                cachedConfig = map[config.id];
              }

              this._copyProperties(cachedConfig, config);
            } else {
              // put any configs with an id into a map
              map[config.id] = config;
            }
          } else {
            allConfigs.push(config);
          }
        }
      }
    }
  },
  /**
   * An element implementing `NeonAnimationRunnerBehavior` calls this
   * method to configure an animation with an optional type. Elements
   * implementing `NeonAnimatableBehavior` should define the property
   * `animationConfig`, which is either a configuration object or a map of
   * animation type to array of configuration objects.
   */getAnimationConfig: function (type) {
    var map = {};
    var allConfigs = [];

    this._getAnimationConfigRecursive(type, map, allConfigs); // append the configurations saved in the map to the array


    for (var key in map) {
      allConfigs.push(map[key]);
    }

    return allConfigs;
  }
};
var neonAnimatableBehavior = {
  NeonAnimatableBehavior: NeonAnimatableBehavior
}; /// BareSpecifier=@polymer\neon-animation\neon-animation-runner-behavior

const NeonAnimationRunnerBehaviorImpl = {
  _configureAnimations: function (configs) {
    var results = [];
    var resultsToPlay = [];

    if (configs.length > 0) {
      for (let config, index = 0; config = configs[index]; index++) {
        let neonAnimation = document.createElement(config.name); // is this element actually a neon animation?

        if (neonAnimation.isNeonAnimation) {
          let result = null; // Closure compiler does not work well with a try / catch here.
          // .configure needs to be explicitly defined

          if (!neonAnimation.configure) {
            /**
             * @param {Object} config
             * @return {AnimationEffectReadOnly}
             */neonAnimation.configure = function (config) {
              return null;
            };
          }

          result = neonAnimation.configure(config);
          resultsToPlay.push({
            result: result,
            config: config,
            neonAnimation: neonAnimation
          });
        } else {
          console.warn(this.is + ':', config.name, 'not found!');
        }
      }
    }

    for (var i = 0; i < resultsToPlay.length; i++) {
      let result = resultsToPlay[i].result;
      let config = resultsToPlay[i].config;
      let neonAnimation = resultsToPlay[i].neonAnimation; // configuration or play could fail if polyfills aren't loaded

      try {
        // Check if we have an Effect rather than an Animation
        if (typeof result.cancel != 'function') {
          result = document.timeline.play(result);
        }
      } catch (e) {
        result = null;
        console.warn('Couldnt play', '(', config.name, ').', e);
      }

      if (result) {
        results.push({
          neonAnimation: neonAnimation,
          config: config,
          animation: result
        });
      }
    }

    return results;
  },
  _shouldComplete: function (activeEntries) {
    var finished = true;

    for (var i = 0; i < activeEntries.length; i++) {
      if (activeEntries[i].animation.playState != 'finished') {
        finished = false;
        break;
      }
    }

    return finished;
  },
  _complete: function (activeEntries) {
    for (var i = 0; i < activeEntries.length; i++) {
      activeEntries[i].neonAnimation.complete(activeEntries[i].config);
    }

    for (var i = 0; i < activeEntries.length; i++) {
      activeEntries[i].animation.cancel();
    }
  },
  /**
   * Plays an animation with an optional `type`.
   * @param {string=} type
   * @param {!Object=} cookie
   */playAnimation: function (type, cookie) {
    var configs = this.getAnimationConfig(type);

    if (!configs) {
      return;
    }

    this._active = this._active || {};

    if (this._active[type]) {
      this._complete(this._active[type]);

      delete this._active[type];
    }

    var activeEntries = this._configureAnimations(configs);

    if (activeEntries.length == 0) {
      this.fire('neon-animation-finish', cookie, {
        bubbles: false
      });
      return;
    }

    this._active[type] = activeEntries;

    for (var i = 0; i < activeEntries.length; i++) {
      activeEntries[i].animation.onfinish = function () {
        if (this._shouldComplete(activeEntries)) {
          this._complete(activeEntries);

          delete this._active[type];
          this.fire('neon-animation-finish', cookie, {
            bubbles: false
          });
        }
      }.bind(this);
    }
  },
  /**
   * Cancels the currently running animations.
   */cancelAnimation: function () {
    for (var k in this._active) {
      var entries = this._active[k];

      for (var j in entries) {
        entries[j].animation.cancel();
      }
    }

    this._active = {};
  }
}; /** @polymerBehavior */
const NeonAnimationRunnerBehavior = [NeonAnimatableBehavior, NeonAnimationRunnerBehaviorImpl];
var neonAnimationRunnerBehavior = {
  NeonAnimationRunnerBehaviorImpl: NeonAnimationRunnerBehaviorImpl,
  NeonAnimationRunnerBehavior: NeonAnimationRunnerBehavior
}; /// BareSpecifier=@polymer\iron-dropdown\iron-dropdown

Polymer({
  _template: html`
    <style>
      :host {
        position: fixed;
      }

      #contentWrapper ::slotted(*) {
        overflow: auto;
      }

      #contentWrapper.animating ::slotted(*) {
        overflow: hidden;
        pointer-events: none;
      }
    </style>

    <div id="contentWrapper">
      <slot id="content" name="dropdown-content"></slot>
    </div>
`,
  is: 'iron-dropdown',
  behaviors: [IronControlState, IronA11yKeysBehavior, IronOverlayBehavior, NeonAnimationRunnerBehavior],
  properties: {
    /**
     * The orientation against which to align the dropdown content
     * horizontally relative to the dropdown trigger.
     * Overridden from `Polymer.IronFitBehavior`.
     */horizontalAlign: {
      type: String,
      value: 'left',
      reflectToAttribute: true
    },
    /**
     * The orientation against which to align the dropdown content
     * vertically relative to the dropdown trigger.
     * Overridden from `Polymer.IronFitBehavior`.
     */verticalAlign: {
      type: String,
      value: 'top',
      reflectToAttribute: true
    },
    /**
     * An animation config. If provided, this will be used to animate the
     * opening of the dropdown. Pass an Array for multiple animations.
     * See `neon-animation` documentation for more animation configuration
     * details.
     */openAnimationConfig: {
      type: Object
    },
    /**
     * An animation config. If provided, this will be used to animate the
     * closing of the dropdown. Pass an Array for multiple animations.
     * See `neon-animation` documentation for more animation configuration
     * details.
     */closeAnimationConfig: {
      type: Object
    },
    /**
     * If provided, this will be the element that will be focused when
     * the dropdown opens.
     */focusTarget: {
      type: Object
    },
    /**
     * Set to true to disable animations when opening and closing the
     * dropdown.
     */noAnimations: {
      type: Boolean,
      value: false
    },
    /**
     * By default, the dropdown will constrain scrolling on the page
     * to itself when opened.
     * Set to true in order to prevent scroll from being constrained
     * to the dropdown when it opens.
     * This property is a shortcut to set `scrollAction` to lock or refit.
     * Prefer directly setting the `scrollAction` property.
     */allowOutsideScroll: {
      type: Boolean,
      value: false,
      observer: '_allowOutsideScrollChanged'
    }
  },
  listeners: {
    'neon-animation-finish': '_onNeonAnimationFinish'
  },
  observers: ['_updateOverlayPosition(positionTarget, verticalAlign, horizontalAlign, verticalOffset, horizontalOffset)'],

  /**
   * The element that is contained by the dropdown, if any.
   */get containedElement() {
    // Polymer 2.x returns slot.assignedNodes which can contain text nodes.
    var nodes = dom(this.$.content).getDistributedNodes();

    for (var i = 0, l = nodes.length; i < l; i++) {
      if (nodes[i].nodeType === Node.ELEMENT_NODE) {
        return nodes[i];
      }
    }
  },

  ready: function () {
    // Ensure scrollAction is set.
    if (!this.scrollAction) {
      this.scrollAction = this.allowOutsideScroll ? 'refit' : 'lock';
    }

    this._readied = true;
  },
  attached: function () {
    if (!this.sizingTarget || this.sizingTarget === this) {
      this.sizingTarget = this.containedElement || this;
    }
  },
  detached: function () {
    this.cancelAnimation();
  },
  /**
   * Called when the value of `opened` changes.
   * Overridden from `IronOverlayBehavior`
   */_openedChanged: function () {
    if (this.opened && this.disabled) {
      this.cancel();
    } else {
      this.cancelAnimation();

      this._updateAnimationConfig();

      IronOverlayBehaviorImpl._openedChanged.apply(this, arguments);
    }
  },
  /**
   * Overridden from `IronOverlayBehavior`.
   */_renderOpened: function () {
    if (!this.noAnimations && this.animationConfig.open) {
      this.$.contentWrapper.classList.add('animating');
      this.playAnimation('open');
    } else {
      IronOverlayBehaviorImpl._renderOpened.apply(this, arguments);
    }
  },
  /**
   * Overridden from `IronOverlayBehavior`.
   */_renderClosed: function () {
    if (!this.noAnimations && this.animationConfig.close) {
      this.$.contentWrapper.classList.add('animating');
      this.playAnimation('close');
    } else {
      IronOverlayBehaviorImpl._renderClosed.apply(this, arguments);
    }
  },
  /**
   * Called when animation finishes on the dropdown (when opening or
   * closing). Responsible for "completing" the process of opening or
   * closing the dropdown by positioning it or setting its display to
   * none.
   */_onNeonAnimationFinish: function () {
    this.$.contentWrapper.classList.remove('animating');

    if (this.opened) {
      this._finishRenderOpened();
    } else {
      this._finishRenderClosed();
    }
  },
  /**
   * Constructs the final animation config from different properties used
   * to configure specific parts of the opening and closing animations.
   */_updateAnimationConfig: function () {
    // Update the animation node to be the containedElement.
    var animationNode = this.containedElement;
    var animations = [].concat(this.openAnimationConfig || []).concat(this.closeAnimationConfig || []);

    for (var i = 0; i < animations.length; i++) {
      animations[i].node = animationNode;
    }

    this.animationConfig = {
      open: this.openAnimationConfig,
      close: this.closeAnimationConfig
    };
  },
  /**
   * Updates the overlay position based on configured horizontal
   * and vertical alignment.
   */_updateOverlayPosition: function () {
    if (this.isAttached) {
      // This triggers iron-resize, and iron-overlay-behavior will call refit if
      // needed.
      this.notifyResize();
    }
  },
  /**
   * Sets scrollAction according to the value of allowOutsideScroll.
   * Prefer setting directly scrollAction.
   */_allowOutsideScrollChanged: function (allowOutsideScroll) {
    // Wait until initial values are all set.
    if (!this._readied) {
      return;
    }

    if (!allowOutsideScroll) {
      this.scrollAction = 'lock';
    } else if (!this.scrollAction || this.scrollAction === 'lock') {
      this.scrollAction = 'refit';
    }
  },
  /**
   * Apply focus to focusTarget or containedElement
   */_applyFocus: function () {
    var focusTarget = this.focusTarget || this.containedElement;

    if (focusTarget && this.opened && !this.noAutoFocus) {
      focusTarget.focus();
    } else {
      IronOverlayBehaviorImpl._applyFocus.apply(this, arguments);
    }
  }
}); /// BareSpecifier=@polymer\iron-icons\editor-icons

const template = html`<iron-iconset-svg name="editor" size="24">
<svg><defs>
<g id="attach-file"><path d="M16.5 6v11.5c0 2.21-1.79 4-4 4s-4-1.79-4-4V5c0-1.38 1.12-2.5 2.5-2.5s2.5 1.12 2.5 2.5v10.5c0 .55-.45 1-1 1s-1-.45-1-1V6H10v9.5c0 1.38 1.12 2.5 2.5 2.5s2.5-1.12 2.5-2.5V5c0-2.21-1.79-4-4-4S7 2.79 7 5v12.5c0 3.04 2.46 5.5 5.5 5.5s5.5-2.46 5.5-5.5V6h-1.5z"></path></g>
<g id="attach-money"><path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z"></path></g>
<g id="border-all"><path d="M3 3v18h18V3H3zm8 16H5v-6h6v6zm0-8H5V5h6v6zm8 8h-6v-6h6v6zm0-8h-6V5h6v6z"></path></g>
<g id="border-bottom"><path d="M9 11H7v2h2v-2zm4 4h-2v2h2v-2zM9 3H7v2h2V3zm4 8h-2v2h2v-2zM5 3H3v2h2V3zm8 4h-2v2h2V7zm4 4h-2v2h2v-2zm-4-8h-2v2h2V3zm4 0h-2v2h2V3zm2 10h2v-2h-2v2zm0 4h2v-2h-2v2zM5 7H3v2h2V7zm14-4v2h2V3h-2zm0 6h2V7h-2v2zM5 11H3v2h2v-2zM3 21h18v-2H3v2zm2-6H3v2h2v-2z"></path></g>
<g id="border-clear"><path d="M7 5h2V3H7v2zm0 8h2v-2H7v2zm0 8h2v-2H7v2zm4-4h2v-2h-2v2zm0 4h2v-2h-2v2zm-8 0h2v-2H3v2zm0-4h2v-2H3v2zm0-4h2v-2H3v2zm0-4h2V7H3v2zm0-4h2V3H3v2zm8 8h2v-2h-2v2zm8 4h2v-2h-2v2zm0-4h2v-2h-2v2zm0 8h2v-2h-2v2zm0-12h2V7h-2v2zm-8 0h2V7h-2v2zm8-6v2h2V3h-2zm-8 2h2V3h-2v2zm4 16h2v-2h-2v2zm0-8h2v-2h-2v2zm0-8h2V3h-2v2z"></path></g>
<g id="border-color"><path d="M17.75 7L14 3.25l-10 10V17h3.75l10-10zm2.96-2.96c.39-.39.39-1.02 0-1.41L18.37.29c-.39-.39-1.02-.39-1.41 0L15 2.25 18.75 6l1.96-1.96z"></path><path fill-opacity=".36" d="M0 20h24v4H0z"></path></g>
<g id="border-horizontal"><path d="M3 21h2v-2H3v2zM5 7H3v2h2V7zM3 17h2v-2H3v2zm4 4h2v-2H7v2zM5 3H3v2h2V3zm4 0H7v2h2V3zm8 0h-2v2h2V3zm-4 4h-2v2h2V7zm0-4h-2v2h2V3zm6 14h2v-2h-2v2zm-8 4h2v-2h-2v2zm-8-8h18v-2H3v2zM19 3v2h2V3h-2zm0 6h2V7h-2v2zm-8 8h2v-2h-2v2zm4 4h2v-2h-2v2zm4 0h2v-2h-2v2z"></path></g>
<g id="border-inner"><path d="M3 21h2v-2H3v2zm4 0h2v-2H7v2zM5 7H3v2h2V7zM3 17h2v-2H3v2zM9 3H7v2h2V3zM5 3H3v2h2V3zm12 0h-2v2h2V3zm2 6h2V7h-2v2zm0-6v2h2V3h-2zm-4 18h2v-2h-2v2zM13 3h-2v8H3v2h8v8h2v-8h8v-2h-8V3zm6 18h2v-2h-2v2zm0-4h2v-2h-2v2z"></path></g>
<g id="border-left"><path d="M11 21h2v-2h-2v2zm0-4h2v-2h-2v2zm0-12h2V3h-2v2zm0 4h2V7h-2v2zm0 4h2v-2h-2v2zm-4 8h2v-2H7v2zM7 5h2V3H7v2zm0 8h2v-2H7v2zm-4 8h2V3H3v18zM19 9h2V7h-2v2zm-4 12h2v-2h-2v2zm4-4h2v-2h-2v2zm0-14v2h2V3h-2zm0 10h2v-2h-2v2zm0 8h2v-2h-2v2zm-4-8h2v-2h-2v2zm0-8h2V3h-2v2z"></path></g>
<g id="border-outer"><path d="M13 7h-2v2h2V7zm0 4h-2v2h2v-2zm4 0h-2v2h2v-2zM3 3v18h18V3H3zm16 16H5V5h14v14zm-6-4h-2v2h2v-2zm-4-4H7v2h2v-2z"></path></g>
<g id="border-right"><path d="M7 21h2v-2H7v2zM3 5h2V3H3v2zm4 0h2V3H7v2zm0 8h2v-2H7v2zm-4 8h2v-2H3v2zm8 0h2v-2h-2v2zm-8-8h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm8 8h2v-2h-2v2zm4-4h2v-2h-2v2zm4-10v18h2V3h-2zm-4 18h2v-2h-2v2zm0-16h2V3h-2v2zm-4 8h2v-2h-2v2zm0-8h2V3h-2v2zm0 4h2V7h-2v2z"></path></g>
<g id="border-style"><path d="M15 21h2v-2h-2v2zm4 0h2v-2h-2v2zM7 21h2v-2H7v2zm4 0h2v-2h-2v2zm8-4h2v-2h-2v2zm0-4h2v-2h-2v2zM3 3v18h2V5h16V3H3zm16 6h2V7h-2v2z"></path></g>
<g id="border-top"><path d="M7 21h2v-2H7v2zm0-8h2v-2H7v2zm4 0h2v-2h-2v2zm0 8h2v-2h-2v2zm-8-4h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2v-2H3v2zm0-4h2V7H3v2zm8 8h2v-2h-2v2zm8-8h2V7h-2v2zm0 4h2v-2h-2v2zM3 3v2h18V3H3zm16 14h2v-2h-2v2zm-4 4h2v-2h-2v2zM11 9h2V7h-2v2zm8 12h2v-2h-2v2zm-4-8h2v-2h-2v2z"></path></g>
<g id="border-vertical"><path d="M3 9h2V7H3v2zm0-4h2V3H3v2zm4 16h2v-2H7v2zm0-8h2v-2H7v2zm-4 0h2v-2H3v2zm0 8h2v-2H3v2zm0-4h2v-2H3v2zM7 5h2V3H7v2zm12 12h2v-2h-2v2zm-8 4h2V3h-2v18zm8 0h2v-2h-2v2zm0-8h2v-2h-2v2zm0-10v2h2V3h-2zm0 6h2V7h-2v2zm-4-4h2V3h-2v2zm0 16h2v-2h-2v2zm0-8h2v-2h-2v2z"></path></g>
<g id="bubble-chart"><circle cx="7.2" cy="14.4" r="3.2"></circle><circle cx="14.8" cy="18" r="2"></circle><circle cx="15.2" cy="8.8" r="4.8"></circle></g>
<g id="drag-handle"><path d="M20 9H4v2h16V9zM4 15h16v-2H4v2z"></path></g>
<g id="format-align-center"><path d="M7 15v2h10v-2H7zm-4 6h18v-2H3v2zm0-8h18v-2H3v2zm4-6v2h10V7H7zM3 3v2h18V3H3z"></path></g>
<g id="format-align-justify"><path d="M3 21h18v-2H3v2zm0-4h18v-2H3v2zm0-4h18v-2H3v2zm0-4h18V7H3v2zm0-6v2h18V3H3z"></path></g>
<g id="format-align-left"><path d="M15 15H3v2h12v-2zm0-8H3v2h12V7zM3 13h18v-2H3v2zm0 8h18v-2H3v2zM3 3v2h18V3H3z"></path></g>
<g id="format-align-right"><path d="M3 21h18v-2H3v2zm6-4h12v-2H9v2zm-6-4h18v-2H3v2zm6-4h12V7H9v2zM3 3v2h18V3H3z"></path></g>
<g id="format-bold"><path d="M15.6 10.79c.97-.67 1.65-1.77 1.65-2.79 0-2.26-1.75-4-4-4H7v14h7.04c2.09 0 3.71-1.7 3.71-3.79 0-1.52-.86-2.82-2.15-3.42zM10 6.5h3c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5h-3v-3zm3.5 9H10v-3h3.5c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5z"></path></g>
<g id="format-clear"><path d="M3.27 5L2 6.27l6.97 6.97L6.5 19h3l1.57-3.66L16.73 21 18 19.73 3.55 5.27 3.27 5zM6 5v.18L8.82 8h2.4l-.72 1.68 2.1 2.1L14.21 8H20V5H6z"></path></g>
<g id="format-color-fill"><path d="M16.56 8.94L7.62 0 6.21 1.41l2.38 2.38-5.15 5.15c-.59.59-.59 1.54 0 2.12l5.5 5.5c.29.29.68.44 1.06.44s.77-.15 1.06-.44l5.5-5.5c.59-.58.59-1.53 0-2.12zM5.21 10L10 5.21 14.79 10H5.21zM19 11.5s-2 2.17-2 3.5c0 1.1.9 2 2 2s2-.9 2-2c0-1.33-2-3.5-2-3.5z"></path><path fill-opacity=".36" d="M0 20h24v4H0z"></path></g>
<g id="format-color-reset"><path d="M18 14c0-4-6-10.8-6-10.8s-1.33 1.51-2.73 3.52l8.59 8.59c.09-.42.14-.86.14-1.31zm-.88 3.12L12.5 12.5 5.27 5.27 4 6.55l3.32 3.32C6.55 11.32 6 12.79 6 14c0 3.31 2.69 6 6 6 1.52 0 2.9-.57 3.96-1.5l2.63 2.63 1.27-1.27-2.74-2.74z"></path></g>
<g id="format-color-text"><path fill-opacity=".36" d="M0 20h24v4H0z"></path><path d="M11 3L5.5 17h2.25l1.12-3h6.25l1.12 3h2.25L13 3h-2zm-1.38 9L12 5.67 14.38 12H9.62z"></path></g>
<g id="format-indent-decrease"><path d="M11 17h10v-2H11v2zm-8-5l4 4V8l-4 4zm0 9h18v-2H3v2zM3 3v2h18V3H3zm8 6h10V7H11v2zm0 4h10v-2H11v2z"></path></g>
<g id="format-indent-increase"><path d="M3 21h18v-2H3v2zM3 8v8l4-4-4-4zm8 9h10v-2H11v2zM3 3v2h18V3H3zm8 6h10V7H11v2zm0 4h10v-2H11v2z"></path></g>
<g id="format-italic"><path d="M10 4v3h2.21l-3.42 8H6v3h8v-3h-2.21l3.42-8H18V4z"></path></g>
<g id="format-line-spacing"><path d="M6 7h2.5L5 3.5 1.5 7H4v10H1.5L5 20.5 8.5 17H6V7zm4-2v2h12V5H10zm0 14h12v-2H10v2zm0-6h12v-2H10v2z"></path></g>
<g id="format-list-bulleted"><path d="M4 10.5c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5 1.5-.67 1.5-1.5-.67-1.5-1.5-1.5zm0-6c-.83 0-1.5.67-1.5 1.5S3.17 7.5 4 7.5 5.5 6.83 5.5 6 4.83 4.5 4 4.5zm0 12c-.83 0-1.5.68-1.5 1.5s.68 1.5 1.5 1.5 1.5-.68 1.5-1.5-.67-1.5-1.5-1.5zM7 19h14v-2H7v2zm0-6h14v-2H7v2zm0-8v2h14V5H7z"></path></g>
<g id="format-list-numbered"><path d="M2 17h2v.5H3v1h1v.5H2v1h3v-4H2v1zm1-9h1V4H2v1h1v3zm-1 3h1.8L2 13.1v.9h3v-1H3.2L5 10.9V10H2v1zm5-6v2h14V5H7zm0 14h14v-2H7v2zm0-6h14v-2H7v2z"></path></g>
<g id="format-paint"><path d="M18 4V3c0-.55-.45-1-1-1H5c-.55 0-1 .45-1 1v4c0 .55.45 1 1 1h12c.55 0 1-.45 1-1V6h1v4H9v11c0 .55.45 1 1 1h2c.55 0 1-.45 1-1v-9h8V4h-3z"></path></g>
<g id="format-quote"><path d="M6 17h3l2-4V7H5v6h3zm8 0h3l2-4V7h-6v6h3z"></path></g>
<g id="format-shapes"><path d="M23 7V1h-6v2H7V1H1v6h2v10H1v6h6v-2h10v2h6v-6h-2V7h2zM3 3h2v2H3V3zm2 18H3v-2h2v2zm12-2H7v-2H5V7h2V5h10v2h2v10h-2v2zm4 2h-2v-2h2v2zM19 5V3h2v2h-2zm-5.27 9h-3.49l-.73 2H7.89l3.4-9h1.4l3.41 9h-1.63l-.74-2zm-3.04-1.26h2.61L12 8.91l-1.31 3.83z"></path></g>
<g id="format-size"><path d="M9 4v3h5v12h3V7h5V4H9zm-6 8h3v7h3v-7h3V9H3v3z"></path></g>
<g id="format-strikethrough"><path d="M10 19h4v-3h-4v3zM5 4v3h5v3h4V7h5V4H5zM3 14h18v-2H3v2z"></path></g>
<g id="format-textdirection-l-to-r"><path d="M9 10v5h2V4h2v11h2V4h2V2H9C6.79 2 5 3.79 5 6s1.79 4 4 4zm12 8l-4-4v3H5v2h12v3l4-4z"></path></g>
<g id="format-textdirection-r-to-l"><path d="M10 10v5h2V4h2v11h2V4h2V2h-8C7.79 2 6 3.79 6 6s1.79 4 4 4zm-2 7v-3l-4 4 4 4v-3h12v-2H8z"></path></g>
<g id="format-underlined"><path d="M12 17c3.31 0 6-2.69 6-6V3h-2.5v8c0 1.93-1.57 3.5-3.5 3.5S8.5 12.93 8.5 11V3H6v8c0 3.31 2.69 6 6 6zm-7 2v2h14v-2H5z"></path></g>
<g id="functions"><path d="M18 4H6v2l6.5 6L6 18v2h12v-3h-7l5-5-5-5h7z"></path></g>
<g id="highlight"><path d="M6 14l3 3v5h6v-5l3-3V9H6zm5-12h2v3h-2zM3.5 5.875L4.914 4.46l2.12 2.122L5.62 7.997zm13.46.71l2.123-2.12 1.414 1.414L18.375 8z"></path></g>
<g id="insert-chart"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"></path></g>
<g id="insert-comment"><path d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14l4 4V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"></path></g>
<g id="insert-drive-file"><path d="M6 2c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6H6zm7 7V3.5L18.5 9H13z"></path></g>
<g id="insert-emoticon"><path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z"></path></g>
<g id="insert-invitation"><path d="M17 12h-5v5h5v-5zM16 1v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2h-1V1h-2zm3 18H5V8h14v11z"></path></g>
<g id="insert-link"><path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z"></path></g>
<g id="insert-photo"><path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"></path></g>
<g id="linear-scale"><path d="M19.5 9.5c-1.03 0-1.9.62-2.29 1.5h-2.92c-.39-.88-1.26-1.5-2.29-1.5s-1.9.62-2.29 1.5H6.79c-.39-.88-1.26-1.5-2.29-1.5C3.12 9.5 2 10.62 2 12s1.12 2.5 2.5 2.5c1.03 0 1.9-.62 2.29-1.5h2.92c.39.88 1.26 1.5 2.29 1.5s1.9-.62 2.29-1.5h2.92c.39.88 1.26 1.5 2.29 1.5 1.38 0 2.5-1.12 2.5-2.5s-1.12-2.5-2.5-2.5z"></path></g>
<g id="merge-type"><path d="M17 20.41L18.41 19 15 15.59 13.59 17 17 20.41zM7.5 8H11v5.59L5.59 19 7 20.41l6-6V8h3.5L12 3.5 7.5 8z"></path></g>
<g id="mode-comment"><path d="M21.99 4c0-1.1-.89-2-1.99-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14l4 4-.01-18z"></path></g>
<g id="mode-edit"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"></path></g>
<g id="monetization-on"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.41 16.09V20h-2.67v-1.93c-1.71-.36-3.16-1.46-3.27-3.4h1.96c.1 1.05.82 1.87 2.65 1.87 1.96 0 2.4-.98 2.4-1.59 0-.83-.44-1.61-2.67-2.14-2.48-.6-4.18-1.62-4.18-3.67 0-1.72 1.39-2.84 3.11-3.21V4h2.67v1.95c1.86.45 2.79 1.86 2.85 3.39H14.3c-.05-1.11-.64-1.87-2.22-1.87-1.5 0-2.4.68-2.4 1.64 0 .84.65 1.39 2.67 1.91s4.18 1.39 4.18 3.91c-.01 1.83-1.38 2.83-3.12 3.16z"></path></g>
<g id="money-off"><path d="M12.5 6.9c1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-.53.12-1.03.3-1.48.54l1.47 1.47c.41-.17.91-.27 1.51-.27zM5.33 4.06L4.06 5.33 7.5 8.77c0 2.08 1.56 3.21 3.91 3.91l3.51 3.51c-.34.48-1.05.91-2.42.91-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c.96-.18 1.82-.55 2.45-1.12l2.22 2.22 1.27-1.27L5.33 4.06z"></path></g>
<g id="multiline-chart"><path d="M22 6.92l-1.41-1.41-2.85 3.21C15.68 6.4 12.83 5 9.61 5 6.72 5 4.07 6.16 2 8l1.42 1.42C5.12 7.93 7.27 7 9.61 7c2.74 0 5.09 1.26 6.77 3.24l-2.88 3.24-4-4L2 16.99l1.5 1.5 6-6.01 4 4 4.05-4.55c.75 1.35 1.25 2.9 1.44 4.55H21c-.22-2.3-.95-4.39-2.04-6.14L22 6.92z"></path></g>
<g id="pie-chart"><path d="M11 2v20c-5.07-.5-9-4.79-9-10s3.93-9.5 9-10zm2.03 0v8.99H22c-.47-4.74-4.24-8.52-8.97-8.99zm0 11.01V22c4.74-.47 8.5-4.25 8.97-8.99h-8.97z"></path></g>
<g id="pie-chart-outlined"><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm1 2.07c3.61.45 6.48 3.33 6.93 6.93H13V4.07zM4 12c0-4.06 3.07-7.44 7-7.93v15.87c-3.93-.5-7-3.88-7-7.94zm9 7.93V13h6.93c-.45 3.61-3.32 6.48-6.93 6.93z"></path></g>
<g id="publish"><path d="M5 4v2h14V4H5zm0 10h4v6h6v-6h4l-7-7-7 7z"></path></g>
<g id="short-text"><path d="M4 9h16v2H4zm0 4h10v2H4z"></path></g>
<g id="show-chart"><path d="M3.5 18.49l6-6.01 4 4L22 6.92l-1.41-1.41-7.09 7.97-4-4L2 16.99z"></path></g>
<g id="space-bar"><path d="M18 9v4H6V9H4v6h16V9z"></path></g>
<g id="strikethrough-s"><path d="M7.24 8.75c-.26-.48-.39-1.03-.39-1.67 0-.61.13-1.16.4-1.67.26-.5.63-.93 1.11-1.29.48-.35 1.05-.63 1.7-.83.66-.19 1.39-.29 2.18-.29.81 0 1.54.11 2.21.34.66.22 1.23.54 1.69.94.47.4.83.88 1.08 1.43.25.55.38 1.15.38 1.81h-3.01c0-.31-.05-.59-.15-.85-.09-.27-.24-.49-.44-.68-.2-.19-.45-.33-.75-.44-.3-.1-.66-.16-1.06-.16-.39 0-.74.04-1.03.13-.29.09-.53.21-.72.36-.19.16-.34.34-.44.55-.1.21-.15.43-.15.66 0 .48.25.88.74 1.21.38.25.77.48 1.41.7H7.39c-.05-.08-.11-.17-.15-.25zM21 12v-2H3v2h9.62c.18.07.4.14.55.2.37.17.66.34.87.51.21.17.35.36.43.57.07.2.11.43.11.69 0 .23-.05.45-.14.66-.09.2-.23.38-.42.53-.19.15-.42.26-.71.35-.29.08-.63.13-1.01.13-.43 0-.83-.04-1.18-.13s-.66-.23-.91-.42c-.25-.19-.45-.44-.59-.75-.14-.31-.25-.76-.25-1.21H6.4c0 .55.08 1.13.24 1.58.16.45.37.85.65 1.21.28.35.6.66.98.92.37.26.78.48 1.22.65.44.17.9.3 1.38.39.48.08.96.13 1.44.13.8 0 1.53-.09 2.18-.28s1.21-.45 1.67-.79c.46-.34.82-.77 1.07-1.27s.38-1.07.38-1.71c0-.6-.1-1.14-.31-1.61-.05-.11-.11-.23-.17-.33H21z"></path></g>
<g id="text-fields"><path d="M2.5 4v3h5v12h3V7h5V4h-13zm19 5h-9v3h3v7h3v-7h3V9z"></path></g>
<g id="title"><path d="M5 4v3h5.5v12h3V7H19V4z"></path></g>
<g id="vertical-align-bottom"><path d="M16 13h-3V3h-2v10H8l4 4 4-4zM4 19v2h16v-2H4z"></path></g>
<g id="vertical-align-center"><path d="M8 19h3v4h2v-4h3l-4-4-4 4zm8-14h-3V1h-2v4H8l4 4 4-4zM4 11v2h16v-2H4z"></path></g>
<g id="vertical-align-top"><path d="M8 11h3v10h2V11h3l-4-4-4 4zM4 3v2h16V3H4z"></path></g>
<g id="wrap-text"><path d="M4 19h6v-2H4v2zM20 5H4v2h16V5zm-3 6H4v2h13.25c1.1 0 2 .9 2 2s-.9 2-2 2H15v-2l-3 3 3 3v-2h2c2.21 0 4-1.79 4-4s-1.79-4-4-4z"></path></g>
</defs></svg>
</iron-iconset-svg>`;
document.head.appendChild(template.content); /// BareSpecifier=@polymer\iron-icons\image-icons

const template$1 = html`<iron-iconset-svg name="image" size="24">
<svg><defs>
<g id="add-a-photo"><path d="M3 4V1h2v3h3v2H5v3H3V6H0V4h3zm3 6V7h3V4h7l1.83 2H21c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H5c-1.1 0-2-.9-2-2V10h3zm7 9c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-3.2-5c0 1.77 1.43 3.2 3.2 3.2s3.2-1.43 3.2-3.2-1.43-3.2-3.2-3.2-3.2 1.43-3.2 3.2z"></path></g>
<g id="add-to-photos"><path d="M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-1 9h-4v4h-2v-4H9V9h4V5h2v4h4v2z"></path></g>
<g id="adjust"><path d="M12 2C6.49 2 2 6.49 2 12s4.49 10 10 10 10-4.49 10-10S17.51 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm3-8c0 1.66-1.34 3-3 3s-3-1.34-3-3 1.34-3 3-3 3 1.34 3 3z"></path></g>
<g id="assistant"><path d="M19 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h4l3 3 3-3h4c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-5.12 10.88L12 17l-1.88-4.12L6 11l4.12-1.88L12 5l1.88 4.12L18 11l-4.12 1.88z"></path></g>
<g id="assistant-photo"><path d="M14.4 6L14 4H5v17h2v-7h5.6l.4 2h7V6z"></path></g>
<g id="audiotrack"><path d="M12 3v9.28c-.47-.17-.97-.28-1.5-.28C8.01 12 6 14.01 6 16.5S8.01 21 10.5 21c2.31 0 4.2-1.75 4.45-4H15V6h4V3h-7z"></path></g>
<g id="blur-circular"><path d="M10 9c-.55 0-1 .45-1 1s.45 1 1 1 1-.45 1-1-.45-1-1-1zm0 4c-.55 0-1 .45-1 1s.45 1 1 1 1-.45 1-1-.45-1-1-1zM7 9.5c-.28 0-.5.22-.5.5s.22.5.5.5.5-.22.5-.5-.22-.5-.5-.5zm3 7c-.28 0-.5.22-.5.5s.22.5.5.5.5-.22.5-.5-.22-.5-.5-.5zm-3-3c-.28 0-.5.22-.5.5s.22.5.5.5.5-.22.5-.5-.22-.5-.5-.5zm3-6c.28 0 .5-.22.5-.5s-.22-.5-.5-.5-.5.22-.5.5.22.5.5.5zM14 9c-.55 0-1 .45-1 1s.45 1 1 1 1-.45 1-1-.45-1-1-1zm0-1.5c.28 0 .5-.22.5-.5s-.22-.5-.5-.5-.5.22-.5.5.22.5.5.5zm3 6c-.28 0-.5.22-.5.5s.22.5.5.5.5-.22.5-.5-.22-.5-.5-.5zm0-4c-.28 0-.5.22-.5.5s.22.5.5.5.5-.22.5-.5-.22-.5-.5-.5zM12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm2-3.5c-.28 0-.5.22-.5.5s.22.5.5.5.5-.22.5-.5-.22-.5-.5-.5zm0-3.5c-.55 0-1 .45-1 1s.45 1 1 1 1-.45 1-1-.45-1-1-1z"></path></g>
<g id="blur-linear"><path d="M5 17.5c.83 0 1.5-.67 1.5-1.5s-.67-1.5-1.5-1.5-1.5.67-1.5 1.5.67 1.5 1.5 1.5zM9 13c.55 0 1-.45 1-1s-.45-1-1-1-1 .45-1 1 .45 1 1 1zm0-4c.55 0 1-.45 1-1s-.45-1-1-1-1 .45-1 1 .45 1 1 1zM3 21h18v-2H3v2zM5 9.5c.83 0 1.5-.67 1.5-1.5S5.83 6.5 5 6.5 3.5 7.17 3.5 8 4.17 9.5 5 9.5zm0 4c.83 0 1.5-.67 1.5-1.5s-.67-1.5-1.5-1.5-1.5.67-1.5 1.5.67 1.5 1.5 1.5zM9 17c.55 0 1-.45 1-1s-.45-1-1-1-1 .45-1 1 .45 1 1 1zm8-.5c.28 0 .5-.22.5-.5s-.22-.5-.5-.5-.5.22-.5.5.22.5.5.5zM3 3v2h18V3H3zm14 5.5c.28 0 .5-.22.5-.5s-.22-.5-.5-.5-.5.22-.5.5.22.5.5.5zm0 4c.28 0 .5-.22.5-.5s-.22-.5-.5-.5-.5.22-.5.5.22.5.5.5zM13 9c.55 0 1-.45 1-1s-.45-1-1-1-1 .45-1 1 .45 1 1 1zm0 4c.55 0 1-.45 1-1s-.45-1-1-1-1 .45-1 1 .45 1 1 1zm0 4c.55 0 1-.45 1-1s-.45-1-1-1-1 .45-1 1 .45 1 1 1z"></path></g>
<g id="blur-off"><path d="M14 7c.55 0 1-.45 1-1s-.45-1-1-1-1 .45-1 1 .45 1 1 1zm-.2 4.48l.2.02c.83 0 1.5-.67 1.5-1.5s-.67-1.5-1.5-1.5-1.5.67-1.5 1.5l.02.2c.09.67.61 1.19 1.28 1.28zM14 3.5c.28 0 .5-.22.5-.5s-.22-.5-.5-.5-.5.22-.5.5.22.5.5.5zm-4 0c.28 0 .5-.22.5-.5s-.22-.5-.5-.5-.5.22-.5.5.22.5.5.5zm11 7c.28 0 .5-.22.5-.5s-.22-.5-.5-.5-.5.22-.5.5.22.5.5.5zM10 7c.55 0 1-.45 1-1s-.45-1-1-1-1 .45-1 1 .45 1 1 1zm8 8c.55 0 1-.45 1-1s-.45-1-1-1-1 .45-1 1 .45 1 1 1zm0-4c.55 0 1-.45 1-1s-.45-1-1-1-1 .45-1 1 .45 1 1 1zm0-4c.55 0 1-.45 1-1s-.45-1-1-1-1 .45-1 1 .45 1 1 1zm-4 13.5c-.28 0-.5.22-.5.5s.22.5.5.5.5-.22.5-.5-.22-.5-.5-.5zM2.5 5.27l3.78 3.78L6 9c-.55 0-1 .45-1 1s.45 1 1 1 1-.45 1-1c0-.1-.03-.19-.06-.28l2.81 2.81c-.71.11-1.25.73-1.25 1.47 0 .83.67 1.5 1.5 1.5.74 0 1.36-.54 1.47-1.25l2.81 2.81c-.09-.03-.18-.06-.28-.06-.55 0-1 .45-1 1s.45 1 1 1 1-.45 1-1c0-.1-.03-.19-.06-.28l3.78 3.78L20 20.23 3.77 4 2.5 5.27zM10 17c-.55 0-1 .45-1 1s.45 1 1 1 1-.45 1-1-.45-1-1-1zm11-3.5c-.28 0-.5.22-.5.5s.22.5.5.5.5-.22.5-.5-.22-.5-.5-.5zM6 13c-.55 0-1 .45-1 1s.45 1 1 1 1-.45 1-1-.45-1-1-1zM3 9.5c-.28 0-.5.22-.5.5s.22.5.5.5.5-.22.5-.5-.22-.5-.5-.5zm7 11c-.28 0-.5.22-.5.5s.22.5.5.5.5-.22.5-.5-.22-.5-.5-.5zM6 17c-.55 0-1 .45-1 1s.45 1 1 1 1-.45 1-1-.45-1-1-1zm-3-3.5c-.28 0-.5.22-.5.5s.22.5.5.5.5-.22.5-.5-.22-.5-.5-.5z"></path></g>
<g id="blur-on"><path d="M6 13c-.55 0-1 .45-1 1s.45 1 1 1 1-.45 1-1-.45-1-1-1zm0 4c-.55 0-1 .45-1 1s.45 1 1 1 1-.45 1-1-.45-1-1-1zm0-8c-.55 0-1 .45-1 1s.45 1 1 1 1-.45 1-1-.45-1-1-1zm-3 .5c-.28 0-.5.22-.5.5s.22.5.5.5.5-.22.5-.5-.22-.5-.5-.5zM6 5c-.55 0-1 .45-1 1s.45 1 1 1 1-.45 1-1-.45-1-1-1zm15 5.5c.28 0 .5-.22.5-.5s-.22-.5-.5-.5-.5.22-.5.5.22.5.5.5zM14 7c.55 0 1-.45 1-1s-.45-1-1-1-1 .45-1 1 .45 1 1 1zm0-3.5c.28 0 .5-.22.5-.5s-.22-.5-.5-.5-.5.22-.5.5.22.5.5.5zm-11 10c-.28 0-.5.22-.5.5s.22.5.5.5.5-.22.5-.5-.22-.5-.5-.5zm7 7c-.28 0-.5.22-.5.5s.22.5.5.5.5-.22.5-.5-.22-.5-.5-.5zm0-17c.28 0 .5-.22.5-.5s-.22-.5-.5-.5-.5.22-.5.5.22.5.5.5zM10 7c.55 0 1-.45 1-1s-.45-1-1-1-1 .45-1 1 .45 1 1 1zm0 5.5c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5 1.5-.67 1.5-1.5-.67-1.5-1.5-1.5zm8 .5c-.55 0-1 .45-1 1s.45 1 1 1 1-.45 1-1-.45-1-1-1zm0 4c-.55 0-1 .45-1 1s.45 1 1 1 1-.45 1-1-.45-1-1-1zm0-8c-.55 0-1 .45-1 1s.45 1 1 1 1-.45 1-1-.45-1-1-1zm0-4c-.55 0-1 .45-1 1s.45 1 1 1 1-.45 1-1-.45-1-1-1zm3 8.5c-.28 0-.5.22-.5.5s.22.5.5.5.5-.22.5-.5-.22-.5-.5-.5zM14 17c-.55 0-1 .45-1 1s.45 1 1 1 1-.45 1-1-.45-1-1-1zm0 3.5c-.28 0-.5.22-.5.5s.22.5.5.5.5-.22.5-.5-.22-.5-.5-.5zm-4-12c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5 1.5-.67 1.5-1.5-.67-1.5-1.5-1.5zm0 8.5c-.55 0-1 .45-1 1s.45 1 1 1 1-.45 1-1-.45-1-1-1zm4-4.5c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5 1.5-.67 1.5-1.5-.67-1.5-1.5-1.5zm0-4c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5 1.5-.67 1.5-1.5-.67-1.5-1.5-1.5z"></path></g>
<g id="brightness-1"><circle cx="12" cy="12" r="10"></circle></g>
<g id="brightness-2"><path d="M10 2c-1.82 0-3.53.5-5 1.35C7.99 5.08 10 8.3 10 12s-2.01 6.92-5 8.65C6.47 21.5 8.18 22 10 22c5.52 0 10-4.48 10-10S15.52 2 10 2z"></path></g>
<g id="brightness-3"><path d="M9 2c-1.05 0-2.05.16-3 .46 4.06 1.27 7 5.06 7 9.54 0 4.48-2.94 8.27-7 9.54.95.3 1.95.46 3 .46 5.52 0 10-4.48 10-10S14.52 2 9 2z"></path></g>
<g id="brightness-4"><path d="M20 8.69V4h-4.69L12 .69 8.69 4H4v4.69L.69 12 4 15.31V20h4.69L12 23.31 15.31 20H20v-4.69L23.31 12 20 8.69zM12 18c-.89 0-1.74-.2-2.5-.55C11.56 16.5 13 14.42 13 12s-1.44-4.5-3.5-5.45C10.26 6.2 11.11 6 12 6c3.31 0 6 2.69 6 6s-2.69 6-6 6z"></path></g>
<g id="brightness-5"><path d="M20 15.31L23.31 12 20 8.69V4h-4.69L12 .69 8.69 4H4v4.69L.69 12 4 15.31V20h4.69L12 23.31 15.31 20H20v-4.69zM12 18c-3.31 0-6-2.69-6-6s2.69-6 6-6 6 2.69 6 6-2.69 6-6 6z"></path></g>
<g id="brightness-6"><path d="M20 15.31L23.31 12 20 8.69V4h-4.69L12 .69 8.69 4H4v4.69L.69 12 4 15.31V20h4.69L12 23.31 15.31 20H20v-4.69zM12 18V6c3.31 0 6 2.69 6 6s-2.69 6-6 6z"></path></g>
<g id="brightness-7"><path d="M20 8.69V4h-4.69L12 .69 8.69 4H4v4.69L.69 12 4 15.31V20h4.69L12 23.31 15.31 20H20v-4.69L23.31 12 20 8.69zM12 18c-3.31 0-6-2.69-6-6s2.69-6 6-6 6 2.69 6 6-2.69 6-6 6zm0-10c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4z"></path></g>
<g id="broken-image"><path d="M21 5v6.59l-3-3.01-4 4.01-4-4-4 4-3-3.01V5c0-1.1.9-2 2-2h14c1.1 0 2 .9 2 2zm-3 6.42l3 3.01V19c0 1.1-.9 2-2 2H5c-1.1 0-2-.9-2-2v-6.58l3 2.99 4-4 4 4 4-3.99z"></path></g>
<g id="brush"><path d="M7 14c-1.66 0-3 1.34-3 3 0 1.31-1.16 2-2 2 .92 1.22 2.49 2 4 2 2.21 0 4-1.79 4-4 0-1.66-1.34-3-3-3zm13.71-9.37l-1.34-1.34c-.39-.39-1.02-.39-1.41 0L9 12.25 11.75 15l8.96-8.96c.39-.39.39-1.02 0-1.41z"></path></g>
<g id="burst-mode"><path d="M1 5h2v14H1zm4 0h2v14H5zm17 0H10c-.55 0-1 .45-1 1v12c0 .55.45 1 1 1h12c.55 0 1-.45 1-1V6c0-.55-.45-1-1-1zM11 17l2.5-3.15L15.29 16l2.5-3.22L21 17H11z"></path></g>
<g id="camera"><path d="M9.4 10.5l4.77-8.26C13.47 2.09 12.75 2 12 2c-2.4 0-4.6.85-6.32 2.25l3.66 6.35.06-.1zM21.54 9c-.92-2.92-3.15-5.26-6-6.34L11.88 9h9.66zm.26 1h-7.49l.29.5 4.76 8.25C21 16.97 22 14.61 22 12c0-.69-.07-1.35-.2-2zM8.54 12l-3.9-6.75C3.01 7.03 2 9.39 2 12c0 .69.07 1.35.2 2h7.49l-1.15-2zm-6.08 3c.92 2.92 3.15 5.26 6 6.34L12.12 15H2.46zm11.27 0l-3.9 6.76c.7.15 1.42.24 2.17.24 2.4 0 4.6-.85 6.32-2.25l-3.66-6.35-.93 1.6z"></path></g>
<g id="camera-alt"><circle cx="12" cy="12" r="3.2"></circle><path d="M9 2L7.17 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2h-3.17L15 2H9zm3 15c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z"></path></g>
<g id="camera-front"><path d="M10 20H5v2h5v2l3-3-3-3v2zm4 0v2h5v-2h-5zM12 8c1.1 0 2-.9 2-2s-.9-2-2-2-1.99.9-1.99 2S10.9 8 12 8zm5-8H7C5.9 0 5 .9 5 2v14c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V2c0-1.1-.9-2-2-2zM7 2h10v10.5c0-1.67-3.33-2.5-5-2.5s-5 .83-5 2.5V2z"></path></g>
<g id="camera-rear"><path d="M10 20H5v2h5v2l3-3-3-3v2zm4 0v2h5v-2h-5zm3-20H7C5.9 0 5 .9 5 2v14c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V2c0-1.1-.9-2-2-2zm-5 6c-1.11 0-2-.9-2-2s.89-2 1.99-2 2 .9 2 2C14 5.1 13.1 6 12 6z"></path></g>
<g id="camera-roll"><path d="M14 5c0-1.1-.9-2-2-2h-1V2c0-.55-.45-1-1-1H6c-.55 0-1 .45-1 1v1H4c-1.1 0-2 .9-2 2v15c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2h8V5h-8zm-2 13h-2v-2h2v2zm0-9h-2V7h2v2zm4 9h-2v-2h2v2zm0-9h-2V7h2v2zm4 9h-2v-2h2v2zm0-9h-2V7h2v2z"></path></g>
<g id="center-focus-strong"><path d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm-7 7H3v4c0 1.1.9 2 2 2h4v-2H5v-4zM5 5h4V3H5c-1.1 0-2 .9-2 2v4h2V5zm14-2h-4v2h4v4h2V5c0-1.1-.9-2-2-2zm0 16h-4v2h4c1.1 0 2-.9 2-2v-4h-2v4z"></path></g>
<g id="center-focus-weak"><path d="M5 15H3v4c0 1.1.9 2 2 2h4v-2H5v-4zM5 5h4V3H5c-1.1 0-2 .9-2 2v4h2V5zm14-2h-4v2h4v4h2V5c0-1.1-.9-2-2-2zm0 16h-4v2h4c1.1 0 2-.9 2-2v-4h-2v4zM12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm0 6c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z"></path></g>
<g id="collections"><path d="M22 16V4c0-1.1-.9-2-2-2H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2zm-11-4l2.03 2.71L16 11l4 5H8l3-4zM2 6v14c0 1.1.9 2 2 2h14v-2H4V6H2z"></path></g>
<g id="collections-bookmark"><path d="M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 10l-2.5-1.5L15 12V4h5v8z"></path></g>
<g id="color-lens"><path d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9c.83 0 1.5-.67 1.5-1.5 0-.39-.15-.74-.39-1.01-.23-.26-.38-.61-.38-.99 0-.83.67-1.5 1.5-1.5H16c2.76 0 5-2.24 5-5 0-4.42-4.03-8-9-8zm-5.5 9c-.83 0-1.5-.67-1.5-1.5S5.67 9 6.5 9 8 9.67 8 10.5 7.33 12 6.5 12zm3-4C8.67 8 8 7.33 8 6.5S8.67 5 9.5 5s1.5.67 1.5 1.5S10.33 8 9.5 8zm5 0c-.83 0-1.5-.67-1.5-1.5S13.67 5 14.5 5s1.5.67 1.5 1.5S15.33 8 14.5 8zm3 4c-.83 0-1.5-.67-1.5-1.5S16.67 9 17.5 9s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"></path></g>
<g id="colorize"><path d="M20.71 5.63l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-3.12 3.12-1.93-1.91-1.41 1.41 1.42 1.42L3 16.25V21h4.75l8.92-8.92 1.42 1.42 1.41-1.41-1.92-1.92 3.12-3.12c.4-.4.4-1.03.01-1.42zM6.92 19L5 17.08l8.06-8.06 1.92 1.92L6.92 19z"></path></g>
<g id="compare"><path d="M10 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h5v2h2V1h-2v2zm0 15H5l5-6v6zm9-15h-5v2h5v13l-5-6v9h5c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z"></path></g>
<g id="control-point"><path d="M13 7h-2v4H7v2h4v4h2v-4h4v-2h-4V7zm-1-5C6.49 2 2 6.49 2 12s4.49 10 10 10 10-4.49 10-10S17.51 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"></path></g>
<g id="control-point-duplicate"><path d="M16 8h-2v3h-3v2h3v3h2v-3h3v-2h-3zM2 12c0-2.79 1.64-5.2 4.01-6.32V3.52C2.52 4.76 0 8.09 0 12s2.52 7.24 6.01 8.48v-2.16C3.64 17.2 2 14.79 2 12zm13-9c-4.96 0-9 4.04-9 9s4.04 9 9 9 9-4.04 9-9-4.04-9-9-9zm0 16c-3.86 0-7-3.14-7-7s3.14-7 7-7 7 3.14 7 7-3.14 7-7 7z"></path></g>
<g id="crop"><path d="M17 15h2V7c0-1.1-.9-2-2-2H9v2h8v8zM7 17V1H5v4H1v2h4v10c0 1.1.9 2 2 2h10v4h2v-4h4v-2H7z"></path></g>
<g id="crop-16-9"><path d="M19 6H5c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm0 10H5V8h14v8z"></path></g>
<g id="crop-3-2"><path d="M19 4H5c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H5V6h14v12z"></path></g>
<g id="crop-5-4"><path d="M19 5H5c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 12H5V7h14v10z"></path></g>
<g id="crop-7-5"><path d="M19 7H5c-1.1 0-2 .9-2 2v6c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V9c0-1.1-.9-2-2-2zm0 8H5V9h14v6z"></path></g>
<g id="crop-din"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14z"></path></g>
<g id="crop-free"><path d="M3 5v4h2V5h4V3H5c-1.1 0-2 .9-2 2zm2 10H3v4c0 1.1.9 2 2 2h4v-2H5v-4zm14 4h-4v2h4c1.1 0 2-.9 2-2v-4h-2v4zm0-16h-4v2h4v4h2V5c0-1.1-.9-2-2-2z"></path></g>
<g id="crop-landscape"><path d="M19 5H5c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 12H5V7h14v10z"></path></g>
<g id="crop-original"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14zm-5.04-6.71l-2.75 3.54-1.96-2.36L6.5 17h11l-3.54-4.71z"></path></g>
<g id="crop-portrait"><path d="M17 3H7c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H7V5h10v14z"></path></g>
<g id="crop-rotate"><path d="M7.47 21.49C4.2 19.93 1.86 16.76 1.5 13H0c.51 6.16 5.66 11 11.95 11 .23 0 .44-.02.66-.03L8.8 20.15l-1.33 1.34zM12.05 0c-.23 0-.44.02-.66.04l3.81 3.81 1.33-1.33C19.8 4.07 22.14 7.24 22.5 11H24c-.51-6.16-5.66-11-11.95-11zM16 14h2V8c0-1.11-.9-2-2-2h-6v2h6v6zm-8 2V4H6v2H4v2h2v8c0 1.1.89 2 2 2h8v2h2v-2h2v-2H8z"></path></g>
<g id="crop-square"><path d="M18 4H6c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H6V6h12v12z"></path></g>
<g id="dehaze"><path d="M2 15.5v2h20v-2H2zm0-5v2h20v-2H2zm0-5v2h20v-2H2z"></path></g>
<g id="details"><path d="M3 4l9 16 9-16H3zm3.38 2h11.25L12 16 6.38 6z"></path></g>
<g id="edit"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"></path></g>
<g id="exposure"><path d="M15 17v2h2v-2h2v-2h-2v-2h-2v2h-2v2h2zm5-15H4c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM5 5h6v2H5V5zm15 15H4L20 4v16z"></path></g>
<g id="exposure-neg-1"><path d="M4 11v2h8v-2H4zm15 7h-2V7.38L14 8.4V6.7L18.7 5h.3v13z"></path></g>
<g id="exposure-neg-2"><path d="M15.05 16.29l2.86-3.07c.38-.39.72-.79 1.04-1.18.32-.39.59-.78.82-1.17.23-.39.41-.78.54-1.17s.19-.79.19-1.18c0-.53-.09-1.02-.27-1.46-.18-.44-.44-.81-.78-1.11-.34-.31-.77-.54-1.26-.71-.51-.16-1.08-.24-1.72-.24-.69 0-1.31.11-1.85.32-.54.21-1 .51-1.36.88-.37.37-.65.8-.84 1.3-.18.47-.27.97-.28 1.5h2.14c.01-.31.05-.6.13-.87.09-.29.23-.54.4-.75.18-.21.41-.37.68-.49.27-.12.6-.18.96-.18.31 0 .58.05.81.15.23.1.43.25.59.43.16.18.28.4.37.65.08.25.13.52.13.81 0 .22-.03.43-.08.65-.06.22-.15.45-.29.7-.14.25-.32.53-.56.83-.23.3-.52.65-.88 1.03l-4.17 4.55V18H21v-1.71h-5.95zM2 11v2h8v-2H2z"></path></g>
<g id="exposure-plus-1"><path d="M10 7H8v4H4v2h4v4h2v-4h4v-2h-4V7zm10 11h-2V7.38L15 8.4V6.7L19.7 5h.3v13z"></path></g>
<g id="exposure-plus-2"><path d="M16.05 16.29l2.86-3.07c.38-.39.72-.79 1.04-1.18.32-.39.59-.78.82-1.17.23-.39.41-.78.54-1.17.13-.39.19-.79.19-1.18 0-.53-.09-1.02-.27-1.46-.18-.44-.44-.81-.78-1.11-.34-.31-.77-.54-1.26-.71-.51-.16-1.08-.24-1.72-.24-.69 0-1.31.11-1.85.32-.54.21-1 .51-1.36.88-.37.37-.65.8-.84 1.3-.18.47-.27.97-.28 1.5h2.14c.01-.31.05-.6.13-.87.09-.29.23-.54.4-.75.18-.21.41-.37.68-.49.27-.12.6-.18.96-.18.31 0 .58.05.81.15.23.1.43.25.59.43.16.18.28.4.37.65.08.25.13.52.13.81 0 .22-.03.43-.08.65-.06.22-.15.45-.29.7-.14.25-.32.53-.56.83-.23.3-.52.65-.88 1.03l-4.17 4.55V18H22v-1.71h-5.95zM8 7H6v4H2v2h4v4h2v-4h4v-2H8V7z"></path></g>
<g id="exposure-zero"><path d="M16.14 12.5c0 1-.1 1.85-.3 2.55-.2.7-.48 1.27-.83 1.7-.36.44-.79.75-1.3.95-.51.2-1.07.3-1.7.3-.62 0-1.18-.1-1.69-.3-.51-.2-.95-.51-1.31-.95-.36-.44-.65-1.01-.85-1.7-.2-.7-.3-1.55-.3-2.55v-2.04c0-1 .1-1.85.3-2.55.2-.7.48-1.26.84-1.69.36-.43.8-.74 1.31-.93C10.81 5.1 11.38 5 12 5c.63 0 1.19.1 1.7.29.51.19.95.5 1.31.93.36.43.64.99.84 1.69.2.7.3 1.54.3 2.55v2.04zm-2.11-2.36c0-.64-.05-1.18-.13-1.62-.09-.44-.22-.79-.4-1.06-.17-.27-.39-.46-.64-.58-.25-.13-.54-.19-.86-.19-.32 0-.61.06-.86.18s-.47.31-.64.58c-.17.27-.31.62-.4 1.06s-.13.98-.13 1.62v2.67c0 .64.05 1.18.14 1.62.09.45.23.81.4 1.09s.39.48.64.61.54.19.87.19c.33 0 .62-.06.87-.19s.46-.33.63-.61c.17-.28.3-.64.39-1.09.09-.45.13-.99.13-1.62v-2.66z"></path></g>
<g id="filter"><path d="M15.96 10.29l-2.75 3.54-1.96-2.36L8.5 15h11l-3.54-4.71zM3 5H1v16c0 1.1.9 2 2 2h16v-2H3V5zm18-4H7c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V3c0-1.1-.9-2-2-2zm0 16H7V3h14v14z"></path></g>
<g id="filter-1"><path d="M3 5H1v16c0 1.1.9 2 2 2h16v-2H3V5zm11 10h2V5h-4v2h2v8zm7-14H7c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V3c0-1.1-.9-2-2-2zm0 16H7V3h14v14z"></path></g>
<g id="filter-2"><path d="M3 5H1v16c0 1.1.9 2 2 2h16v-2H3V5zm18-4H7c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V3c0-1.1-.9-2-2-2zm0 16H7V3h14v14zm-4-4h-4v-2h2c1.1 0 2-.89 2-2V7c0-1.11-.9-2-2-2h-4v2h4v2h-2c-1.1 0-2 .89-2 2v4h6v-2z"></path></g>
<g id="filter-3"><path d="M21 1H7c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V3c0-1.1-.9-2-2-2zm0 16H7V3h14v14zM3 5H1v16c0 1.1.9 2 2 2h16v-2H3V5zm14 8v-1.5c0-.83-.67-1.5-1.5-1.5.83 0 1.5-.67 1.5-1.5V7c0-1.11-.9-2-2-2h-4v2h4v2h-2v2h2v2h-4v2h4c1.1 0 2-.89 2-2z"></path></g>
<g id="filter-4"><path d="M3 5H1v16c0 1.1.9 2 2 2h16v-2H3V5zm12 10h2V5h-2v4h-2V5h-2v6h4v4zm6-14H7c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V3c0-1.1-.9-2-2-2zm0 16H7V3h14v14z"></path></g>
<g id="filter-5"><path d="M21 1H7c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V3c0-1.1-.9-2-2-2zm0 16H7V3h14v14zM3 5H1v16c0 1.1.9 2 2 2h16v-2H3V5zm14 8v-2c0-1.11-.9-2-2-2h-2V7h4V5h-6v6h4v2h-4v2h4c1.1 0 2-.89 2-2z"></path></g>
<g id="filter-6"><path d="M3 5H1v16c0 1.1.9 2 2 2h16v-2H3V5zm18-4H7c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V3c0-1.1-.9-2-2-2zm0 16H7V3h14v14zm-8-2h2c1.1 0 2-.89 2-2v-2c0-1.11-.9-2-2-2h-2V7h4V5h-4c-1.1 0-2 .89-2 2v6c0 1.11.9 2 2 2zm0-4h2v2h-2v-2z"></path></g>
<g id="filter-7"><path d="M3 5H1v16c0 1.1.9 2 2 2h16v-2H3V5zm18-4H7c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V3c0-1.1-.9-2-2-2zm0 16H7V3h14v14zm-8-2l4-8V5h-6v2h4l-4 8h2z"></path></g>
<g id="filter-8"><path d="M3 5H1v16c0 1.1.9 2 2 2h16v-2H3V5zm18-4H7c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V3c0-1.1-.9-2-2-2zm0 16H7V3h14v14zm-8-2h2c1.1 0 2-.89 2-2v-1.5c0-.83-.67-1.5-1.5-1.5.83 0 1.5-.67 1.5-1.5V7c0-1.11-.9-2-2-2h-2c-1.1 0-2 .89-2 2v1.5c0 .83.67 1.5 1.5 1.5-.83 0-1.5.67-1.5 1.5V13c0 1.11.9 2 2 2zm0-8h2v2h-2V7zm0 4h2v2h-2v-2z"></path></g>
<g id="filter-9"><path d="M3 5H1v16c0 1.1.9 2 2 2h16v-2H3V5zm18-4H7c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V3c0-1.1-.9-2-2-2zm0 16H7V3h14v14zM15 5h-2c-1.1 0-2 .89-2 2v2c0 1.11.9 2 2 2h2v2h-4v2h4c1.1 0 2-.89 2-2V7c0-1.11-.9-2-2-2zm0 4h-2V7h2v2z"></path></g>
<g id="filter-9-plus"><path d="M3 5H1v16c0 1.1.9 2 2 2h16v-2H3V5zm11 7V8c0-1.11-.9-2-2-2h-1c-1.1 0-2 .89-2 2v1c0 1.11.9 2 2 2h1v1H9v2h3c1.1 0 2-.89 2-2zm-3-3V8h1v1h-1zm10-8H7c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V3c0-1.1-.9-2-2-2zm0 8h-2V7h-2v2h-2v2h2v2h2v-2h2v6H7V3h14v6z"></path></g>
<g id="filter-b-and-w"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16l-7-8v8H5l7-8V5h7v14z"></path></g>
<g id="filter-center-focus"><path d="M5 15H3v4c0 1.1.9 2 2 2h4v-2H5v-4zM5 5h4V3H5c-1.1 0-2 .9-2 2v4h2V5zm14-2h-4v2h4v4h2V5c0-1.1-.9-2-2-2zm0 16h-4v2h4c1.1 0 2-.9 2-2v-4h-2v4zM12 9c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"></path></g>
<g id="filter-drama"><path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.61 5.64 5.36 8.04 2.35 8.36 0 10.9 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM19 18H6c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4h2c0-2.76-1.86-5.08-4.4-5.78C8.61 6.88 10.2 6 12 6c3.03 0 5.5 2.47 5.5 5.5v.5H19c1.65 0 3 1.35 3 3s-1.35 3-3 3z"></path></g>
<g id="filter-frames"><path d="M20 4h-4l-4-4-4 4H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H4V6h4.52l3.52-3.5L15.52 6H20v14zM18 8H6v10h12"></path></g>
<g id="filter-hdr"><path d="M14 6l-3.75 5 2.85 3.8-1.6 1.2C9.81 13.75 7 10 7 10l-6 8h22L14 6z"></path></g>
<g id="filter-none"><path d="M3 5H1v16c0 1.1.9 2 2 2h16v-2H3V5zm18-4H7c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V3c0-1.1-.9-2-2-2zm0 16H7V3h14v14z"></path></g>
<g id="filter-tilt-shift"><path d="M11 4.07V2.05c-2.01.2-3.84 1-5.32 2.21L7.1 5.69c1.11-.86 2.44-1.44 3.9-1.62zm7.32.19C16.84 3.05 15.01 2.25 13 2.05v2.02c1.46.18 2.79.76 3.9 1.62l1.42-1.43zM19.93 11h2.02c-.2-2.01-1-3.84-2.21-5.32L18.31 7.1c.86 1.11 1.44 2.44 1.62 3.9zM5.69 7.1L4.26 5.68C3.05 7.16 2.25 8.99 2.05 11h2.02c.18-1.46.76-2.79 1.62-3.9zM4.07 13H2.05c.2 2.01 1 3.84 2.21 5.32l1.43-1.43c-.86-1.1-1.44-2.43-1.62-3.89zM15 12c0-1.66-1.34-3-3-3s-3 1.34-3 3 1.34 3 3 3 3-1.34 3-3zm3.31 4.9l1.43 1.43c1.21-1.48 2.01-3.32 2.21-5.32h-2.02c-.18 1.45-.76 2.78-1.62 3.89zM13 19.93v2.02c2.01-.2 3.84-1 5.32-2.21l-1.43-1.43c-1.1.86-2.43 1.44-3.89 1.62zm-7.32-.19C7.16 20.95 9 21.75 11 21.95v-2.02c-1.46-.18-2.79-.76-3.9-1.62l-1.42 1.43z"></path></g>
<g id="filter-vintage"><path d="M18.7 12.4c-.28-.16-.57-.29-.86-.4.29-.11.58-.24.86-.4 1.92-1.11 2.99-3.12 3-5.19-1.79-1.03-4.07-1.11-6 0-.28.16-.54.35-.78.54.05-.31.08-.63.08-.95 0-2.22-1.21-4.15-3-5.19C10.21 1.85 9 3.78 9 6c0 .32.03.64.08.95-.24-.2-.5-.39-.78-.55-1.92-1.11-4.2-1.03-6 0 0 2.07 1.07 4.08 3 5.19.28.16.57.29.86.4-.29.11-.58.24-.86.4-1.92 1.11-2.99 3.12-3 5.19 1.79 1.03 4.07 1.11 6 0 .28-.16.54-.35.78-.54-.05.32-.08.64-.08.96 0 2.22 1.21 4.15 3 5.19 1.79-1.04 3-2.97 3-5.19 0-.32-.03-.64-.08-.95.24.2.5.38.78.54 1.92 1.11 4.2 1.03 6 0-.01-2.07-1.08-4.08-3-5.19zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4z"></path></g>
<g id="flare"><path d="M7 11H1v2h6v-2zm2.17-3.24L7.05 5.64 5.64 7.05l2.12 2.12 1.41-1.41zM13 1h-2v6h2V1zm5.36 6.05l-1.41-1.41-2.12 2.12 1.41 1.41 2.12-2.12zM17 11v2h6v-2h-6zm-5-2c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3zm2.83 7.24l2.12 2.12 1.41-1.41-2.12-2.12-1.41 1.41zm-9.19.71l1.41 1.41 2.12-2.12-1.41-1.41-2.12 2.12zM11 23h2v-6h-2v6z"></path></g>
<g id="flash-auto"><path d="M3 2v12h3v9l7-12H9l4-9H3zm16 0h-2l-3.2 9h1.9l.7-2h3.2l.7 2h1.9L19 2zm-2.15 5.65L18 4l1.15 3.65h-2.3z"></path></g>
<g id="flash-off"><path d="M3.27 3L2 4.27l5 5V13h3v9l3.58-6.14L17.73 20 19 18.73 3.27 3zM17 10h-4l4-8H7v2.18l8.46 8.46L17 10z"></path></g>
<g id="flash-on"><path d="M7 2v11h3v9l7-12h-4l4-8z"></path></g>
<g id="flip"><path d="M15 21h2v-2h-2v2zm4-12h2V7h-2v2zM3 5v14c0 1.1.9 2 2 2h4v-2H5V5h4V3H5c-1.1 0-2 .9-2 2zm16-2v2h2c0-1.1-.9-2-2-2zm-8 20h2V1h-2v22zm8-6h2v-2h-2v2zM15 5h2V3h-2v2zm4 8h2v-2h-2v2zm0 8c1.1 0 2-.9 2-2h-2v2z"></path></g>
<g id="gradient"><path d="M11 9h2v2h-2zm-2 2h2v2H9zm4 0h2v2h-2zm2-2h2v2h-2zM7 9h2v2H7zm12-6H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 18H7v-2h2v2zm4 0h-2v-2h2v2zm4 0h-2v-2h2v2zm2-7h-2v2h2v2h-2v-2h-2v2h-2v-2h-2v2H9v-2H7v2H5v-2h2v-2H5V5h14v6z"></path></g>
<g id="grain"><path d="M10 12c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zM6 8c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 8c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm12-8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm-4 8c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm4-4c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm-4-4c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm-4-4c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"></path></g>
<g id="grid-off"><path d="M8 4v1.45l2 2V4h4v4h-3.45l2 2H14v1.45l2 2V10h4v4h-3.45l2 2H20v1.45l2 2V4c0-1.1-.9-2-2-2H4.55l2 2H8zm8 0h4v4h-4V4zM1.27 1.27L0 2.55l2 2V20c0 1.1.9 2 2 2h15.46l2 2 1.27-1.27L1.27 1.27zM10 12.55L11.45 14H10v-1.45zm-6-6L5.45 8H4V6.55zM8 20H4v-4h4v4zm0-6H4v-4h3.45l.55.55V14zm6 6h-4v-4h3.45l.55.54V20zm2 0v-1.46L17.46 20H16z"></path></g>
<g id="grid-on"><path d="M20 2H4c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM8 20H4v-4h4v4zm0-6H4v-4h4v4zm0-6H4V4h4v4zm6 12h-4v-4h4v4zm0-6h-4v-4h4v4zm0-6h-4V4h4v4zm6 12h-4v-4h4v4zm0-6h-4v-4h4v4zm0-6h-4V4h4v4z"></path></g>
<g id="hdr-off"><path d="M17.5 15v-2h1.1l.9 2H21l-.9-2.1c.5-.2.9-.8.9-1.4v-1c0-.8-.7-1.5-1.5-1.5H16v4.9l1.1 1.1h.4zm0-4.5h2v1h-2v-1zm-4.5 0v.4l1.5 1.5v-1.9c0-.8-.7-1.5-1.5-1.5h-1.9l1.5 1.5h.4zm-3.5-1l-7-7-1.1 1L6.9 9h-.4v2h-2V9H3v6h1.5v-2.5h2V15H8v-4.9l1.5 1.5V15h3.4l7.6 7.6 1.1-1.1-12.1-12z"></path></g>
<g id="hdr-on"><path d="M21 11.5v-1c0-.8-.7-1.5-1.5-1.5H16v6h1.5v-2h1.1l.9 2H21l-.9-2.1c.5-.3.9-.8.9-1.4zm-1.5 0h-2v-1h2v1zm-13-.5h-2V9H3v6h1.5v-2.5h2V15H8V9H6.5v2zM13 9H9.5v6H13c.8 0 1.5-.7 1.5-1.5v-3c0-.8-.7-1.5-1.5-1.5zm0 4.5h-2v-3h2v3z"></path></g>
<g id="hdr-strong"><path d="M17 6c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zM5 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm0 6c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z"></path></g>
<g id="hdr-weak"><path d="M5 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm12-2c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm0 10c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4z"></path></g>
<g id="healing"><path d="M17.73 12.02l3.98-3.98c.39-.39.39-1.02 0-1.41l-4.34-4.34c-.39-.39-1.02-.39-1.41 0l-3.98 3.98L8 2.29C7.8 2.1 7.55 2 7.29 2c-.25 0-.51.1-.7.29L2.25 6.63c-.39.39-.39 1.02 0 1.41l3.98 3.98L2.25 16c-.39.39-.39 1.02 0 1.41l4.34 4.34c.39.39 1.02.39 1.41 0l3.98-3.98 3.98 3.98c.2.2.45.29.71.29.26 0 .51-.1.71-.29l4.34-4.34c.39-.39.39-1.02 0-1.41l-3.99-3.98zM12 9c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm-4.71 1.96L3.66 7.34l3.63-3.63 3.62 3.62-3.62 3.63zM10 13c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm2 2c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm2-4c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm2.66 9.34l-3.63-3.62 3.63-3.63 3.62 3.62-3.62 3.63z"></path></g>
<g id="image"><path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"></path></g>
<g id="image-aspect-ratio"><path d="M16 10h-2v2h2v-2zm0 4h-2v2h2v-2zm-8-4H6v2h2v-2zm4 0h-2v2h2v-2zm8-6H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H4V6h16v12z"></path></g>
<g id="iso"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM5.5 7.5h2v-2H9v2h2V9H9v2H7.5V9h-2V7.5zM19 19H5L19 5v14zm-2-2v-1.5h-5V17h5z"></path></g>
<g id="landscape"><path d="M14 6l-3.75 5 2.85 3.8-1.6 1.2C9.81 13.75 7 10 7 10l-6 8h22L14 6z"></path></g>
<g id="leak-add"><path d="M6 3H3v3c1.66 0 3-1.34 3-3zm8 0h-2c0 4.97-4.03 9-9 9v2c6.08 0 11-4.93 11-11zm-4 0H8c0 2.76-2.24 5-5 5v2c3.87 0 7-3.13 7-7zm0 18h2c0-4.97 4.03-9 9-9v-2c-6.07 0-11 4.93-11 11zm8 0h3v-3c-1.66 0-3 1.34-3 3zm-4 0h2c0-2.76 2.24-5 5-5v-2c-3.87 0-7 3.13-7 7z"></path></g>
<g id="leak-remove"><path d="M10 3H8c0 .37-.04.72-.12 1.06l1.59 1.59C9.81 4.84 10 3.94 10 3zM3 4.27l2.84 2.84C5.03 7.67 4.06 8 3 8v2c1.61 0 3.09-.55 4.27-1.46L8.7 9.97C7.14 11.24 5.16 12 3 12v2c2.71 0 5.19-.99 7.11-2.62l2.5 2.5C10.99 15.81 10 18.29 10 21h2c0-2.16.76-4.14 2.03-5.69l1.43 1.43C14.55 17.91 14 19.39 14 21h2c0-1.06.33-2.03.89-2.84L19.73 21 21 19.73 4.27 3 3 4.27zM14 3h-2c0 1.5-.37 2.91-1.02 4.16l1.46 1.46C13.42 6.98 14 5.06 14 3zm5.94 13.12c.34-.08.69-.12 1.06-.12v-2c-.94 0-1.84.19-2.66.52l1.6 1.6zm-4.56-4.56l1.46 1.46C18.09 12.37 19.5 12 21 12v-2c-2.06 0-3.98.58-5.62 1.56z"></path></g>
<g id="lens"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"></path></g>
<g id="linked-camera"><circle cx="12" cy="14" r="3.2"></circle><path d="M16 3.33c2.58 0 4.67 2.09 4.67 4.67H22c0-3.31-2.69-6-6-6v1.33M16 6c1.11 0 2 .89 2 2h1.33c0-1.84-1.49-3.33-3.33-3.33V6"></path><path d="M17 9c0-1.11-.89-2-2-2V4H9L7.17 6H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V9h-5zm-5 10c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z"></path></g>
<g id="looks"><path d="M12 10c-3.86 0-7 3.14-7 7h2c0-2.76 2.24-5 5-5s5 2.24 5 5h2c0-3.86-3.14-7-7-7zm0-4C5.93 6 1 10.93 1 17h2c0-4.96 4.04-9 9-9s9 4.04 9 9h2c0-6.07-4.93-11-11-11z"></path></g>
<g id="looks-3"><path d="M19.01 3h-14c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-4 7.5c0 .83-.67 1.5-1.5 1.5.83 0 1.5.67 1.5 1.5V15c0 1.11-.9 2-2 2h-4v-2h4v-2h-2v-2h2V9h-4V7h4c1.1 0 2 .89 2 2v1.5z"></path></g>
<g id="looks-4"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-4 14h-2v-4H9V7h2v4h2V7h2v10z"></path></g>
<g id="looks-5"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-4 6h-4v2h2c1.1 0 2 .89 2 2v2c0 1.11-.9 2-2 2H9v-2h4v-2H9V7h6v2z"></path></g>
<g id="looks-6"><path d="M11 15h2v-2h-2v2zm8-12H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-4 6h-4v2h2c1.1 0 2 .89 2 2v2c0 1.11-.9 2-2 2h-2c-1.1 0-2-.89-2-2V9c0-1.11.9-2 2-2h4v2z"></path></g>
<g id="looks-one"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14h-2V9h-2V7h4v10z"></path></g>
<g id="looks-two"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-4 8c0 1.11-.9 2-2 2h-2v2h4v2H9v-4c0-1.11.9-2 2-2h2V9H9V7h4c1.1 0 2 .89 2 2v2z"></path></g>
<g id="loupe"><path d="M13 7h-2v4H7v2h4v4h2v-4h4v-2h-4V7zm-1-5C6.49 2 2 6.49 2 12s4.49 10 10 10h8c1.1 0 2-.9 2-2v-8c0-5.51-4.49-10-10-10zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"></path></g>
<g id="monochrome-photos"><path d="M20 5h-3.2L15 3H9L7.2 5H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 14h-8v-1c-2.8 0-5-2.2-5-5s2.2-5 5-5V7h8v12zm-3-6c0-2.8-2.2-5-5-5v1.8c1.8 0 3.2 1.4 3.2 3.2s-1.4 3.2-3.2 3.2V18c2.8 0 5-2.2 5-5zm-8.2 0c0 1.8 1.4 3.2 3.2 3.2V9.8c-1.8 0-3.2 1.4-3.2 3.2z"></path></g>
<g id="movie-creation"><path d="M18 4l2 4h-3l-2-4h-2l2 4h-3l-2-4H8l2 4H7L5 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4h-4z"></path></g>
<g id="movie-filter"><path d="M18 4l2 3h-3l-2-3h-2l2 3h-3l-2-3H8l2 3H7L5 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4h-4zm-6.75 11.25L10 18l-1.25-2.75L6 14l2.75-1.25L10 10l1.25 2.75L14 14l-2.75 1.25zm5.69-3.31L16 14l-.94-2.06L13 11l2.06-.94L16 8l.94 2.06L19 11l-2.06.94z"></path></g>
<g id="music-note"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"></path></g>
<g id="nature"><path d="M13 16.12c3.47-.41 6.17-3.36 6.17-6.95 0-3.87-3.13-7-7-7s-7 3.13-7 7c0 3.47 2.52 6.34 5.83 6.89V20H5v2h14v-2h-6v-3.88z"></path></g>
<g id="nature-people"><path d="M22.17 9.17c0-3.87-3.13-7-7-7s-7 3.13-7 7c0 3.47 2.52 6.34 5.83 6.89V20H6v-3h1v-4c0-.55-.45-1-1-1H3c-.55 0-1 .45-1 1v4h1v5h16v-2h-3v-3.88c3.47-.41 6.17-3.36 6.17-6.95zM4.5 11c.83 0 1.5-.67 1.5-1.5S5.33 8 4.5 8 3 8.67 3 9.5 3.67 11 4.5 11z"></path></g>
<g id="navigate-before"><path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"></path></g>
<g id="navigate-next"><path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"></path></g>
<g id="palette"><path d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9c.83 0 1.5-.67 1.5-1.5 0-.39-.15-.74-.39-1.01-.23-.26-.38-.61-.38-.99 0-.83.67-1.5 1.5-1.5H16c2.76 0 5-2.24 5-5 0-4.42-4.03-8-9-8zm-5.5 9c-.83 0-1.5-.67-1.5-1.5S5.67 9 6.5 9 8 9.67 8 10.5 7.33 12 6.5 12zm3-4C8.67 8 8 7.33 8 6.5S8.67 5 9.5 5s1.5.67 1.5 1.5S10.33 8 9.5 8zm5 0c-.83 0-1.5-.67-1.5-1.5S13.67 5 14.5 5s1.5.67 1.5 1.5S15.33 8 14.5 8zm3 4c-.83 0-1.5-.67-1.5-1.5S16.67 9 17.5 9s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"></path></g>
<g id="panorama"><path d="M23 18V6c0-1.1-.9-2-2-2H3c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2zM8.5 12.5l2.5 3.01L14.5 11l4.5 6H5l3.5-4.5z"></path></g>
<g id="panorama-fish-eye"><path d="M12 2C6.47 2 2 6.47 2 12s4.47 10 10 10 10-4.47 10-10S17.53 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"></path></g>
<g id="panorama-horizontal"><path d="M20 6.54v10.91c-2.6-.77-5.28-1.16-8-1.16-2.72 0-5.4.39-8 1.16V6.54c2.6.77 5.28 1.16 8 1.16 2.72.01 5.4-.38 8-1.16M21.43 4c-.1 0-.2.02-.31.06C18.18 5.16 15.09 5.7 12 5.7c-3.09 0-6.18-.55-9.12-1.64-.11-.04-.22-.06-.31-.06-.34 0-.57.23-.57.63v14.75c0 .39.23.62.57.62.1 0 .2-.02.31-.06 2.94-1.1 6.03-1.64 9.12-1.64 3.09 0 6.18.55 9.12 1.64.11.04.21.06.31.06.33 0 .57-.23.57-.63V4.63c0-.4-.24-.63-.57-.63z"></path></g>
<g id="panorama-vertical"><path d="M19.94 21.12c-1.1-2.94-1.64-6.03-1.64-9.12 0-3.09.55-6.18 1.64-9.12.04-.11.06-.22.06-.31 0-.34-.23-.57-.63-.57H4.63c-.4 0-.63.23-.63.57 0 .1.02.2.06.31C5.16 5.82 5.71 8.91 5.71 12c0 3.09-.55 6.18-1.64 9.12-.05.11-.07.22-.07.31 0 .33.23.57.63.57h14.75c.39 0 .63-.24.63-.57-.01-.1-.03-.2-.07-.31zM6.54 20c.77-2.6 1.16-5.28 1.16-8 0-2.72-.39-5.4-1.16-8h10.91c-.77 2.6-1.16 5.28-1.16 8 0 2.72.39 5.4 1.16 8H6.54z"></path></g>
<g id="panorama-wide-angle"><path d="M12 6c2.45 0 4.71.2 7.29.64.47 1.78.71 3.58.71 5.36 0 1.78-.24 3.58-.71 5.36-2.58.44-4.84.64-7.29.64s-4.71-.2-7.29-.64C4.24 15.58 4 13.78 4 12c0-1.78.24-3.58.71-5.36C7.29 6.2 9.55 6 12 6m0-2c-2.73 0-5.22.24-7.95.72l-.93.16-.25.9C2.29 7.85 2 9.93 2 12s.29 4.15.87 6.22l.25.89.93.16c2.73.49 5.22.73 7.95.73s5.22-.24 7.95-.72l.93-.16.25-.89c.58-2.08.87-4.16.87-6.23s-.29-4.15-.87-6.22l-.25-.89-.93-.16C17.22 4.24 14.73 4 12 4z"></path></g>
<g id="photo"><path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"></path></g>
<g id="photo-album"><path d="M18 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 4h5v8l-2.5-1.5L6 12V4zm0 15l3-3.86 2.14 2.58 3-3.86L18 19H6z"></path></g>
<g id="photo-camera"><circle cx="12" cy="12" r="3.2"></circle><path d="M9 2L7.17 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2h-3.17L15 2H9zm3 15c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z"></path></g>
<g id="photo-filter"><path d="M19.02 10v9H5V5h9V3H5.02c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-9h-2zM17 10l.94-2.06L20 7l-2.06-.94L17 4l-.94 2.06L14 7l2.06.94zm-3.75.75L12 8l-1.25 2.75L8 12l2.75 1.25L12 16l1.25-2.75L16 12z"></path></g>
<g id="photo-library"><path d="M22 16V4c0-1.1-.9-2-2-2H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2zm-11-4l2.03 2.71L16 11l4 5H8l3-4zM2 6v14c0 1.1.9 2 2 2h14v-2H4V6H2z"></path></g>
<g id="photo-size-select-actual"><path d="M21 3H3C2 3 1 4 1 5v14c0 1.1.9 2 2 2h18c1 0 2-1 2-2V5c0-1-1-2-2-2zM5 17l3.5-4.5 2.5 3.01L14.5 11l4.5 6H5z"></path></g>
<g id="photo-size-select-large"><path d="M21 15h2v2h-2v-2zm0-4h2v2h-2v-2zm2 8h-2v2c1 0 2-1 2-2zM13 3h2v2h-2V3zm8 4h2v2h-2V7zm0-4v2h2c0-1-1-2-2-2zM1 7h2v2H1V7zm16-4h2v2h-2V3zm0 16h2v2h-2v-2zM3 3C2 3 1 4 1 5h2V3zm6 0h2v2H9V3zM5 3h2v2H5V3zm-4 8v8c0 1.1.9 2 2 2h12V11H1zm2 8l2.5-3.21 1.79 2.15 2.5-3.22L13 19H3z"></path></g>
<g id="photo-size-select-small"><path d="M23 15h-2v2h2v-2zm0-4h-2v2h2v-2zm0 8h-2v2c1 0 2-1 2-2zM15 3h-2v2h2V3zm8 4h-2v2h2V7zm-2-4v2h2c0-1-1-2-2-2zM3 21h8v-6H1v4c0 1.1.9 2 2 2zM3 7H1v2h2V7zm12 12h-2v2h2v-2zm4-16h-2v2h2V3zm0 16h-2v2h2v-2zM3 3C2 3 1 4 1 5h2V3zm0 8H1v2h2v-2zm8-8H9v2h2V3zM7 3H5v2h2V3z"></path></g>
<g id="picture-as-pdf"><path d="M20 2H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-8.5 7.5c0 .83-.67 1.5-1.5 1.5H9v2H7.5V7H10c.83 0 1.5.67 1.5 1.5v1zm5 2c0 .83-.67 1.5-1.5 1.5h-2.5V7H15c.83 0 1.5.67 1.5 1.5v3zm4-3H19v1h1.5V11H19v2h-1.5V7h3v1.5zM9 9.5h1v-1H9v1zM4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm10 5.5h1v-3h-1v3z"></path></g>
<g id="portrait"><path d="M12 12.25c1.24 0 2.25-1.01 2.25-2.25S13.24 7.75 12 7.75 9.75 8.76 9.75 10s1.01 2.25 2.25 2.25zm4.5 4c0-1.5-3-2.25-4.5-2.25s-4.5.75-4.5 2.25V17h9v-.75zM19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14z"></path></g>
<g id="remove-red-eye"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"></path></g>
<g id="rotate-90-degrees-ccw"><path d="M7.34 6.41L.86 12.9l6.49 6.48 6.49-6.48-6.5-6.49zM3.69 12.9l3.66-3.66L11 12.9l-3.66 3.66-3.65-3.66zm15.67-6.26C17.61 4.88 15.3 4 13 4V.76L8.76 5 13 9.24V6c1.79 0 3.58.68 4.95 2.05 2.73 2.73 2.73 7.17 0 9.9C16.58 19.32 14.79 20 13 20c-.97 0-1.94-.21-2.84-.61l-1.49 1.49C10.02 21.62 11.51 22 13 22c2.3 0 4.61-.88 6.36-2.64 3.52-3.51 3.52-9.21 0-12.72z"></path></g>
<g id="rotate-left"><path d="M7.11 8.53L5.7 7.11C4.8 8.27 4.24 9.61 4.07 11h2.02c.14-.87.49-1.72 1.02-2.47zM6.09 13H4.07c.17 1.39.72 2.73 1.62 3.89l1.41-1.42c-.52-.75-.87-1.59-1.01-2.47zm1.01 5.32c1.16.9 2.51 1.44 3.9 1.61V17.9c-.87-.15-1.71-.49-2.46-1.03L7.1 18.32zM13 4.07V1L8.45 5.55 13 10V6.09c2.84.48 5 2.94 5 5.91s-2.16 5.43-5 5.91v2.02c3.95-.49 7-3.85 7-7.93s-3.05-7.44-7-7.93z"></path></g>
<g id="rotate-right"><path d="M15.55 5.55L11 1v3.07C7.06 4.56 4 7.92 4 12s3.05 7.44 7 7.93v-2.02c-2.84-.48-5-2.94-5-5.91s2.16-5.43 5-5.91V10l4.55-4.45zM19.93 11c-.17-1.39-.72-2.73-1.62-3.89l-1.42 1.42c.54.75.88 1.6 1.02 2.47h2.02zM13 17.9v2.02c1.39-.17 2.74-.71 3.9-1.61l-1.44-1.44c-.75.54-1.59.89-2.46 1.03zm3.89-2.42l1.42 1.41c.9-1.16 1.45-2.5 1.62-3.89h-2.02c-.14.87-.48 1.72-1.02 2.48z"></path></g>
<g id="slideshow"><path d="M10 8v8l5-4-5-4zm9-5H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14z"></path></g>
<g id="straighten"><path d="M21 6H3c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm0 10H3V8h2v4h2V8h2v4h2V8h2v4h2V8h2v4h2V8h2v8z"></path></g>
<g id="style"><path d="M2.53 19.65l1.34.56v-9.03l-2.43 5.86c-.41 1.02.08 2.19 1.09 2.61zm19.5-3.7L17.07 3.98c-.31-.75-1.04-1.21-1.81-1.23-.26 0-.53.04-.79.15L7.1 5.95c-.75.31-1.21 1.03-1.23 1.8-.01.27.04.54.15.8l4.96 11.97c.31.76 1.05 1.22 1.83 1.23.26 0 .52-.05.77-.15l7.36-3.05c1.02-.42 1.51-1.59 1.09-2.6zM7.88 8.75c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm-2 11c0 1.1.9 2 2 2h1.45l-3.45-8.34v6.34z"></path></g>
<g id="switch-camera"><path d="M20 4h-3.17L15 2H9L7.17 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm-5 11.5V13H9v2.5L5.5 12 9 8.5V11h6V8.5l3.5 3.5-3.5 3.5z"></path></g>
<g id="switch-video"><path d="M18 9.5V6c0-.55-.45-1-1-1H3c-.55 0-1 .45-1 1v12c0 .55.45 1 1 1h14c.55 0 1-.45 1-1v-3.5l4 4v-13l-4 4zm-5 6V13H7v2.5L3.5 12 7 8.5V11h6V8.5l3.5 3.5-3.5 3.5z"></path></g>
<g id="tag-faces"><path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z"></path></g>
<g id="texture"><path d="M19.51 3.08L3.08 19.51c.09.34.27.65.51.9.25.24.56.42.9.51L20.93 4.49c-.19-.69-.73-1.23-1.42-1.41zM11.88 3L3 11.88v2.83L14.71 3h-2.83zM5 3c-1.1 0-2 .9-2 2v2l4-4H5zm14 18c.55 0 1.05-.22 1.41-.59.37-.36.59-.86.59-1.41v-2l-4 4h2zm-9.71 0h2.83L21 12.12V9.29L9.29 21z"></path></g>
<g id="timelapse"><path d="M16.24 7.76C15.07 6.59 13.54 6 12 6v6l-4.24 4.24c2.34 2.34 6.14 2.34 8.49 0 2.34-2.34 2.34-6.14-.01-8.48zM12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z"></path></g>
<g id="timer"><path d="M15 1H9v2h6V1zm-4 13h2V8h-2v6zm8.03-6.61l1.42-1.42c-.43-.51-.9-.99-1.41-1.41l-1.42 1.42C16.07 4.74 14.12 4 12 4c-4.97 0-9 4.03-9 9s4.02 9 9 9 9-4.03 9-9c0-2.12-.74-4.07-1.97-5.61zM12 20c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z"></path></g>
<g id="timer-10"><path d="M0 7.72V9.4l3-1V18h2V6h-.25L0 7.72zm23.78 6.65c-.14-.28-.35-.53-.63-.74-.28-.21-.61-.39-1.01-.53s-.85-.27-1.35-.38c-.35-.07-.64-.15-.87-.23-.23-.08-.41-.16-.55-.25-.14-.09-.23-.19-.28-.3-.05-.11-.08-.24-.08-.39 0-.14.03-.28.09-.41.06-.13.15-.25.27-.34.12-.1.27-.18.45-.24s.4-.09.64-.09c.25 0 .47.04.66.11.19.07.35.17.48.29.13.12.22.26.29.42.06.16.1.32.1.49h1.95c0-.39-.08-.75-.24-1.09-.16-.34-.39-.63-.69-.88-.3-.25-.66-.44-1.09-.59C21.49 9.07 21 9 20.46 9c-.51 0-.98.07-1.39.21-.41.14-.77.33-1.06.57-.29.24-.51.52-.67.84-.16.32-.23.65-.23 1.01s.08.69.23.96c.15.28.36.52.64.73.27.21.6.38.98.53.38.14.81.26 1.27.36.39.08.71.17.95.26s.43.19.57.29c.13.1.22.22.27.34.05.12.07.25.07.39 0 .32-.13.57-.4.77-.27.2-.66.29-1.17.29-.22 0-.43-.02-.64-.08-.21-.05-.4-.13-.56-.24-.17-.11-.3-.26-.41-.44-.11-.18-.17-.41-.18-.67h-1.89c0 .36.08.71.24 1.05.16.34.39.65.7.93.31.27.69.49 1.15.66.46.17.98.25 1.58.25.53 0 1.01-.06 1.44-.19.43-.13.8-.31 1.11-.54.31-.23.54-.51.71-.83.17-.32.25-.67.25-1.06-.02-.4-.09-.74-.24-1.02zm-9.96-7.32c-.34-.4-.75-.7-1.23-.88-.47-.18-1.01-.27-1.59-.27-.58 0-1.11.09-1.59.27-.48.18-.89.47-1.23.88-.34.41-.6.93-.79 1.59-.18.65-.28 1.45-.28 2.39v1.92c0 .94.09 1.74.28 2.39.19.66.45 1.19.8 1.6.34.41.75.71 1.23.89.48.18 1.01.28 1.59.28.59 0 1.12-.09 1.59-.28.48-.18.88-.48 1.22-.89.34-.41.6-.94.78-1.6.18-.65.28-1.45.28-2.39v-1.92c0-.94-.09-1.74-.28-2.39-.18-.66-.44-1.19-.78-1.59zm-.92 6.17c0 .6-.04 1.11-.12 1.53-.08.42-.2.76-.36 1.02-.16.26-.36.45-.59.57-.23.12-.51.18-.82.18-.3 0-.58-.06-.82-.18s-.44-.31-.6-.57c-.16-.26-.29-.6-.38-1.02-.09-.42-.13-.93-.13-1.53v-2.5c0-.6.04-1.11.13-1.52.09-.41.21-.74.38-1 .16-.25.36-.43.6-.55.24-.11.51-.17.81-.17.31 0 .58.06.81.17.24.11.44.29.6.55.16.25.29.58.37.99.08.41.13.92.13 1.52v2.51z"></path></g>
<g id="timer-3"><path d="M11.61 12.97c-.16-.24-.36-.46-.62-.65-.25-.19-.56-.35-.93-.48.3-.14.57-.3.8-.5.23-.2.42-.41.57-.64.15-.23.27-.46.34-.71.08-.24.11-.49.11-.73 0-.55-.09-1.04-.28-1.46-.18-.42-.44-.77-.78-1.06-.33-.28-.73-.5-1.2-.64-.45-.13-.97-.2-1.53-.2-.55 0-1.06.08-1.52.24-.47.17-.87.4-1.2.69-.33.29-.6.63-.78 1.03-.2.39-.29.83-.29 1.29h1.98c0-.26.05-.49.14-.69.09-.2.22-.38.38-.52.17-.14.36-.25.58-.33.22-.08.46-.12.73-.12.61 0 1.06.16 1.36.47.3.31.44.75.44 1.32 0 .27-.04.52-.12.74-.08.22-.21.41-.38.57-.17.16-.38.28-.63.37-.25.09-.55.13-.89.13H6.72v1.57H7.9c.34 0 .64.04.91.11.27.08.5.19.69.35.19.16.34.36.44.61.1.24.16.54.16.87 0 .62-.18 1.09-.53 1.42-.35.33-.84.49-1.45.49-.29 0-.56-.04-.8-.13-.24-.08-.44-.2-.61-.36-.17-.16-.3-.34-.39-.56-.09-.22-.14-.46-.14-.72H4.19c0 .55.11 1.03.32 1.45.21.42.5.77.86 1.05s.77.49 1.24.63.96.21 1.48.21c.57 0 1.09-.08 1.58-.23.49-.15.91-.38 1.26-.68.36-.3.64-.66.84-1.1.2-.43.3-.93.3-1.48 0-.29-.04-.58-.11-.86-.08-.25-.19-.51-.35-.76zm9.26 1.4c-.14-.28-.35-.53-.63-.74-.28-.21-.61-.39-1.01-.53s-.85-.27-1.35-.38c-.35-.07-.64-.15-.87-.23-.23-.08-.41-.16-.55-.25-.14-.09-.23-.19-.28-.3-.05-.11-.08-.24-.08-.39s.03-.28.09-.41c.06-.13.15-.25.27-.34.12-.1.27-.18.45-.24s.4-.09.64-.09c.25 0 .47.04.66.11.19.07.35.17.48.29.13.12.22.26.29.42.06.16.1.32.1.49h1.95c0-.39-.08-.75-.24-1.09-.16-.34-.39-.63-.69-.88-.3-.25-.66-.44-1.09-.59-.43-.15-.92-.22-1.46-.22-.51 0-.98.07-1.39.21-.41.14-.77.33-1.06.57-.29.24-.51.52-.67.84-.16.32-.23.65-.23 1.01s.08.68.23.96c.15.28.37.52.64.73.27.21.6.38.98.53.38.14.81.26 1.27.36.39.08.71.17.95.26s.43.19.57.29c.13.1.22.22.27.34.05.12.07.25.07.39 0 .32-.13.57-.4.77-.27.2-.66.29-1.17.29-.22 0-.43-.02-.64-.08-.21-.05-.4-.13-.56-.24-.17-.11-.3-.26-.41-.44-.11-.18-.17-.41-.18-.67h-1.89c0 .36.08.71.24 1.05.16.34.39.65.7.93.31.27.69.49 1.15.66.46.17.98.25 1.58.25.53 0 1.01-.06 1.44-.19.43-.13.8-.31 1.11-.54.31-.23.54-.51.71-.83.17-.32.25-.67.25-1.06-.02-.4-.09-.74-.24-1.02z"></path></g>
<g id="timer-off"><path d="M19.04 4.55l-1.42 1.42C16.07 4.74 14.12 4 12 4c-1.83 0-3.53.55-4.95 1.48l1.46 1.46C9.53 6.35 10.73 6 12 6c3.87 0 7 3.13 7 7 0 1.27-.35 2.47-.94 3.49l1.45 1.45C20.45 16.53 21 14.83 21 13c0-2.12-.74-4.07-1.97-5.61l1.42-1.42-1.41-1.42zM15 1H9v2h6V1zm-4 8.44l2 2V8h-2v1.44zM3.02 4L1.75 5.27 4.5 8.03C3.55 9.45 3 11.16 3 13c0 4.97 4.02 9 9 9 1.84 0 3.55-.55 4.98-1.5l2.5 2.5 1.27-1.27-7.71-7.71L3.02 4zM12 20c-3.87 0-7-3.13-7-7 0-1.28.35-2.48.95-3.52l9.56 9.56c-1.03.61-2.23.96-3.51.96z"></path></g>
<g id="tonality"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93s3.05-7.44 7-7.93v15.86zm2-15.86c1.03.13 2 .45 2.87.93H13v-.93zM13 7h5.24c.25.31.48.65.68 1H13V7zm0 3h6.74c.08.33.15.66.19 1H13v-1zm0 9.93V19h2.87c-.87.48-1.84.8-2.87.93zM18.24 17H13v-1h5.92c-.2.35-.43.69-.68 1zm1.5-3H13v-1h6.93c-.04.34-.11.67-.19 1z"></path></g>
<g id="transform"><path d="M22 18v-2H8V4h2L7 1 4 4h2v2H2v2h4v8c0 1.1.9 2 2 2h8v2h-2l3 3 3-3h-2v-2h4zM10 8h6v6h2V8c0-1.1-.9-2-2-2h-6v2z"></path></g>
<g id="tune"><path d="M3 17v2h6v-2H3zM3 5v2h10V5H3zm10 16v-2h8v-2h-8v-2h-2v6h2zM7 9v2H3v2h4v2h2V9H7zm14 4v-2H11v2h10zm-6-4h2V7h4V5h-4V3h-2v6z"></path></g>
<g id="view-comfy"><path d="M3 9h4V5H3v4zm0 5h4v-4H3v4zm5 0h4v-4H8v4zm5 0h4v-4h-4v4zM8 9h4V5H8v4zm5-4v4h4V5h-4zm5 9h4v-4h-4v4zM3 19h4v-4H3v4zm5 0h4v-4H8v4zm5 0h4v-4h-4v4zm5 0h4v-4h-4v4zm0-14v4h4V5h-4z"></path></g>
<g id="view-compact"><path d="M3 19h6v-7H3v7zm7 0h12v-7H10v7zM3 5v6h19V5H3z"></path></g>
<g id="vignette"><path d="M21 3H3c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-9 15c-4.42 0-8-2.69-8-6s3.58-6 8-6 8 2.69 8 6-3.58 6-8 6z"></path></g>
<g id="wb-auto"><path d="M6.85 12.65h2.3L8 9l-1.15 3.65zM22 7l-1.2 6.29L19.3 7h-1.6l-1.49 6.29L15 7h-.76C12.77 5.17 10.53 4 8 4c-4.42 0-8 3.58-8 8s3.58 8 8 8c3.13 0 5.84-1.81 7.15-4.43l.1.43H17l1.5-6.1L20 16h1.75l2.05-9H22zm-11.7 9l-.7-2H6.4l-.7 2H3.8L7 7h2l3.2 9h-1.9z"></path></g>
<g id="wb-cloudy"><path d="M19.36 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.64-4.96z"></path></g>
<g id="wb-incandescent"><path d="M3.55 18.54l1.41 1.41 1.79-1.8-1.41-1.41-1.79 1.8zM11 22.45h2V19.5h-2v2.95zM4 10.5H1v2h3v-2zm11-4.19V1.5H9v4.81C7.21 7.35 6 9.28 6 11.5c0 3.31 2.69 6 6 6s6-2.69 6-6c0-2.22-1.21-4.15-3-5.19zm5 4.19v2h3v-2h-3zm-2.76 7.66l1.79 1.8 1.41-1.41-1.8-1.79-1.4 1.4z"></path></g>
<g id="wb-iridescent"><path d="M5 14.5h14v-6H5v6zM11 .55V3.5h2V.55h-2zm8.04 2.5l-1.79 1.79 1.41 1.41 1.8-1.79-1.42-1.41zM13 22.45V19.5h-2v2.95h2zm7.45-3.91l-1.8-1.79-1.41 1.41 1.79 1.8 1.42-1.42zM3.55 4.46l1.79 1.79 1.41-1.41-1.79-1.79-1.41 1.41zm1.41 15.49l1.79-1.8-1.41-1.41-1.79 1.79 1.41 1.42z"></path></g>
<g id="wb-sunny"><path d="M6.76 4.84l-1.8-1.79-1.41 1.41 1.79 1.79 1.42-1.41zM4 10.5H1v2h3v-2zm9-9.95h-2V3.5h2V.55zm7.45 3.91l-1.41-1.41-1.79 1.79 1.41 1.41 1.79-1.79zm-3.21 13.7l1.79 1.8 1.41-1.41-1.8-1.79-1.4 1.4zM20 10.5v2h3v-2h-3zm-8-5c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm-1 16.95h2V19.5h-2v2.95zm-7.45-3.91l1.41 1.41 1.79-1.8-1.41-1.41-1.79 1.8z"></path></g>
</defs></svg>
</iron-iconset-svg>`;
document.head.appendChild(template$1.content); /// BareSpecifier=@polymer\iron-icons\notification-icons

const template$2 = html`<iron-iconset-svg name="notification" size="24">
<svg><defs>
<g id="adb"><path d="M5 16c0 3.87 3.13 7 7 7s7-3.13 7-7v-4H5v4zM16.12 4.37l2.1-2.1-.82-.83-2.3 2.31C14.16 3.28 13.12 3 12 3s-2.16.28-3.09.75L6.6 1.44l-.82.83 2.1 2.1C6.14 5.64 5 7.68 5 10v1h14v-1c0-2.32-1.14-4.36-2.88-5.63zM9 9c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm6 0c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z"></path></g>
<g id="airline-seat-flat"><path d="M22 11v2H9V7h9c2.21 0 4 1.79 4 4zM2 14v2h6v2h8v-2h6v-2H2zm5.14-1.9c1.16-1.19 1.14-3.08-.04-4.24-1.19-1.16-3.08-1.14-4.24.04-1.16 1.19-1.14 3.08.04 4.24 1.19 1.16 3.08 1.14 4.24-.04z"></path></g>
<g id="airline-seat-flat-angled"><path d="M22.25 14.29l-.69 1.89L9.2 11.71l2.08-5.66 8.56 3.09c2.1.76 3.18 3.06 2.41 5.15zM1.5 12.14L8 14.48V19h8v-1.63L20.52 19l.69-1.89-19.02-6.86-.69 1.89zm5.8-1.94c1.49-.72 2.12-2.51 1.41-4C7.99 4.71 6.2 4.08 4.7 4.8c-1.49.71-2.12 2.5-1.4 4 .71 1.49 2.5 2.12 4 1.4z"></path></g>
<g id="airline-seat-individual-suite"><path d="M7 13c1.65 0 3-1.35 3-3S8.65 7 7 7s-3 1.35-3 3 1.35 3 3 3zm12-6h-8v7H3V7H1v10h22v-6c0-2.21-1.79-4-4-4z"></path></g>
<g id="airline-seat-legroom-extra"><path d="M4 12V3H2v9c0 2.76 2.24 5 5 5h6v-2H7c-1.66 0-3-1.34-3-3zm18.83 5.24c-.38-.72-1.29-.97-2.03-.63l-1.09.5-3.41-6.98c-.34-.68-1.03-1.12-1.79-1.12L11 9V3H5v8c0 1.66 1.34 3 3 3h7l3.41 7 3.72-1.7c.77-.36 1.1-1.3.7-2.06z"></path></g>
<g id="airline-seat-legroom-normal"><path d="M5 12V3H3v9c0 2.76 2.24 5 5 5h6v-2H8c-1.66 0-3-1.34-3-3zm15.5 6H19v-7c0-1.1-.9-2-2-2h-5V3H6v8c0 1.65 1.35 3 3 3h7v7h4.5c.83 0 1.5-.67 1.5-1.5s-.67-1.5-1.5-1.5z"></path></g>
<g id="airline-seat-legroom-reduced"><path d="M19.97 19.2c.18.96-.55 1.8-1.47 1.8H14v-3l1-4H9c-1.65 0-3-1.35-3-3V3h6v6h5c1.1 0 2 .9 2 2l-2 7h1.44c.73 0 1.39.49 1.53 1.2zM5 12V3H3v9c0 2.76 2.24 5 5 5h4v-2H8c-1.66 0-3-1.34-3-3z"></path></g>
<g id="airline-seat-recline-extra"><path d="M5.35 5.64c-.9-.64-1.12-1.88-.49-2.79.63-.9 1.88-1.12 2.79-.49.9.64 1.12 1.88.49 2.79-.64.9-1.88 1.12-2.79.49zM16 19H8.93c-1.48 0-2.74-1.08-2.96-2.54L4 7H2l1.99 9.76C4.37 19.2 6.47 21 8.94 21H16v-2zm.23-4h-4.88l-1.03-4.1c1.58.89 3.28 1.54 5.15 1.22V9.99c-1.63.31-3.44-.27-4.69-1.25L9.14 7.47c-.23-.18-.49-.3-.76-.38-.32-.09-.66-.12-.99-.06h-.02c-1.23.22-2.05 1.39-1.84 2.61l1.35 5.92C7.16 16.98 8.39 18 9.83 18h6.85l3.82 3 1.5-1.5-5.77-4.5z"></path></g>
<g id="airline-seat-recline-normal"><path d="M7.59 5.41c-.78-.78-.78-2.05 0-2.83.78-.78 2.05-.78 2.83 0 .78.78.78 2.05 0 2.83-.79.79-2.05.79-2.83 0zM6 16V7H4v9c0 2.76 2.24 5 5 5h6v-2H9c-1.66 0-3-1.34-3-3zm14 4.07L14.93 15H11.5v-3.68c1.4 1.15 3.6 2.16 5.5 2.16v-2.16c-1.66.02-3.61-.87-4.67-2.04l-1.4-1.55c-.19-.21-.43-.38-.69-.5-.29-.14-.62-.23-.96-.23h-.03C8.01 7 7 8.01 7 9.25V15c0 1.66 1.34 3 3 3h5.07l3.5 3.5L20 20.07z"></path></g>
<g id="bluetooth-audio"><path d="M14.24 12.01l2.32 2.32c.28-.72.44-1.51.44-2.33 0-.82-.16-1.59-.43-2.31l-2.33 2.32zm5.29-5.3l-1.26 1.26c.63 1.21.98 2.57.98 4.02s-.36 2.82-.98 4.02l1.2 1.2c.97-1.54 1.54-3.36 1.54-5.31-.01-1.89-.55-3.67-1.48-5.19zm-3.82 1L10 2H9v7.59L4.41 5 3 6.41 8.59 12 3 17.59 4.41 19 9 14.41V22h1l5.71-5.71-4.3-4.29 4.3-4.29zM11 5.83l1.88 1.88L11 9.59V5.83zm1.88 10.46L11 18.17v-3.76l1.88 1.88z"></path></g>
<g id="confirmation-number"><path d="M22 10V6c0-1.11-.9-2-2-2H4c-1.1 0-1.99.89-1.99 2v4c1.1 0 1.99.9 1.99 2s-.89 2-2 2v4c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2v-4c-1.1 0-2-.9-2-2s.9-2 2-2zm-9 7.5h-2v-2h2v2zm0-4.5h-2v-2h2v2zm0-4.5h-2v-2h2v2z"></path></g>
<g id="disc-full"><path d="M20 16h2v-2h-2v2zm0-9v5h2V7h-2zM10 4c-4.42 0-8 3.58-8 8s3.58 8 8 8 8-3.58 8-8-3.58-8-8-8zm0 10c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z"></path></g>
<g id="do-not-disturb"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8 0-1.85.63-3.55 1.69-4.9L16.9 18.31C15.55 19.37 13.85 20 12 20zm6.31-3.1L7.1 5.69C8.45 4.63 10.15 4 12 4c4.42 0 8 3.58 8 8 0 1.85-.63 3.55-1.69 4.9z"></path></g>
<g id="do-not-disturb-alt"><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zM4 12c0-4.4 3.6-8 8-8 1.8 0 3.5.6 4.9 1.7L5.7 16.9C4.6 15.5 4 13.8 4 12zm8 8c-1.8 0-3.5-.6-4.9-1.7L18.3 7.1C19.4 8.5 20 10.2 20 12c0 4.4-3.6 8-8 8z"></path></g>
<g id="do-not-disturb-off"><path d="M17 11v2h-1.46l4.68 4.68C21.34 16.07 22 14.11 22 12c0-5.52-4.48-10-10-10-2.11 0-4.07.66-5.68 1.78L13.54 11H17zM2.27 2.27L1 3.54l2.78 2.78C2.66 7.93 2 9.89 2 12c0 5.52 4.48 10 10 10 2.11 0 4.07-.66 5.68-1.78L20.46 23l1.27-1.27L11 11 2.27 2.27zM7 13v-2h1.46l2 2H7z"></path></g>
<g id="do-not-disturb-on"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11H7v-2h10v2z"></path></g>
<g id="drive-eta"><path d="M18.92 5.01C18.72 4.42 18.16 4 17.5 4h-11c-.66 0-1.21.42-1.42 1.01L3 11v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 15c-.83 0-1.5-.67-1.5-1.5S5.67 12 6.5 12s1.5.67 1.5 1.5S7.33 15 6.5 15zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 10l1.5-4.5h11L19 10H5z"></path></g>
<g id="enhanced-encryption"><path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zM8.9 6c0-1.71 1.39-3.1 3.1-3.1s3.1 1.39 3.1 3.1v2H8.9V6zM16 16h-3v3h-2v-3H8v-2h3v-3h2v3h3v2z"></path></g>
<g id="event-available"><path d="M16.53 11.06L15.47 10l-4.88 4.88-2.12-2.12-1.06 1.06L10.59 17l5.94-5.94zM19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11z"></path></g>
<g id="event-busy"><path d="M9.31 17l2.44-2.44L14.19 17l1.06-1.06-2.44-2.44 2.44-2.44L14.19 10l-2.44 2.44L9.31 10l-1.06 1.06 2.44 2.44-2.44 2.44L9.31 17zM19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11z"></path></g>
<g id="event-note"><path d="M17 10H7v2h10v-2zm2-7h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zm-5-5H7v2h7v-2z"></path></g>
<g id="folder-special"><path d="M20 6h-8l-2-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-2.06 11L15 15.28 12.06 17l.78-3.33-2.59-2.24 3.41-.29L15 8l1.34 3.14 3.41.29-2.59 2.24.78 3.33z"></path></g>
<g id="live-tv"><path d="M21 6h-7.59l3.29-3.29L16 2l-4 4-4-4-.71.71L10.59 6H3c-1.1 0-2 .89-2 2v12c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V8c0-1.11-.9-2-2-2zm0 14H3V8h18v12zM9 10v8l7-4z"></path></g>
<g id="mms"><path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM5 14l3.5-4.5 2.5 3.01L14.5 8l4.5 6H5z"></path></g>
<g id="more"><path d="M22 3H7c-.69 0-1.23.35-1.59.88L0 12l5.41 8.11c.36.53.97.89 1.66.89H22c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 13.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm5 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm5 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"></path></g>
<g id="network-check"><path d="M15.9 5c-.17 0-.32.09-.41.23l-.07.15-5.18 11.65c-.16.29-.26.61-.26.96 0 1.11.9 2.01 2.01 2.01.96 0 1.77-.68 1.96-1.59l.01-.03L16.4 5.5c0-.28-.22-.5-.5-.5zM1 9l2 2c2.88-2.88 6.79-4.08 10.53-3.62l1.19-2.68C9.89 3.84 4.74 5.27 1 9zm20 2l2-2c-1.64-1.64-3.55-2.82-5.59-3.57l-.53 2.82c1.5.62 2.9 1.53 4.12 2.75zm-4 4l2-2c-.8-.8-1.7-1.42-2.66-1.89l-.55 2.92c.42.27.83.59 1.21.97zM5 13l2 2c1.13-1.13 2.56-1.79 4.03-2l1.28-2.88c-2.63-.08-5.3.87-7.31 2.88z"></path></g>
<g id="network-locked"><path d="M19.5 10c.17 0 .33.03.5.05V1L1 20h13v-3c0-.89.39-1.68 1-2.23v-.27c0-2.48 2.02-4.5 4.5-4.5zm2.5 6v-1.5c0-1.38-1.12-2.5-2.5-2.5S17 13.12 17 14.5V16c-.55 0-1 .45-1 1v4c0 .55.45 1 1 1h5c.55 0 1-.45 1-1v-4c0-.55-.45-1-1-1zm-1 0h-3v-1.5c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5V16z"></path></g>
<g id="no-encryption"><path d="M21 21.78L4.22 5 3 6.22l2.04 2.04C4.42 8.6 4 9.25 4 10v10c0 1.1.9 2 2 2h12c.23 0 .45-.05.66-.12L19.78 23 21 21.78zM8.9 6c0-1.71 1.39-3.1 3.1-3.1s3.1 1.39 3.1 3.1v2H9.66L20 18.34V10c0-1.1-.9-2-2-2h-1V6c0-2.76-2.24-5-5-5-2.56 0-4.64 1.93-4.94 4.4L8.9 7.24V6z"></path></g>
<g id="ondemand-video"><path d="M21 3H3c-1.11 0-2 .89-2 2v12c0 1.1.89 2 2 2h5v2h8v-2h5c1.1 0 1.99-.9 1.99-2L23 5c0-1.11-.9-2-2-2zm0 14H3V5h18v12zm-5-6l-7 4V7z"></path></g>
<g id="personal-video"><path d="M21 3H3c-1.11 0-2 .89-2 2v12c0 1.1.89 2 2 2h5v2h8v-2h5c1.1 0 1.99-.9 1.99-2L23 5c0-1.11-.9-2-2-2zm0 14H3V5h18v12z"></path></g>
<g id="phone-bluetooth-speaker"><path d="M14.71 9.5L17 7.21V11h.5l2.85-2.85L18.21 6l2.15-2.15L17.5 1H17v3.79L14.71 2.5l-.71.71L16.79 6 14 8.79l.71.71zM18 2.91l.94.94-.94.94V2.91zm0 4.3l.94.94-.94.94V7.21zm2 8.29c-1.25 0-2.45-.2-3.57-.57-.35-.11-.74-.03-1.02.24l-2.2 2.2c-2.83-1.44-5.15-3.75-6.59-6.59l2.2-2.21c.28-.26.36-.65.25-1C8.7 6.45 8.5 5.25 8.5 4c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1 0 9.39 7.61 17 17 17 .55 0 1-.45 1-1v-3.5c0-.55-.45-1-1-1z"></path></g>
<g id="phone-forwarded"><path d="M18 11l5-5-5-5v3h-4v4h4v3zm2 4.5c-1.25 0-2.45-.2-3.57-.57-.35-.11-.74-.03-1.02.24l-2.2 2.2c-2.83-1.44-5.15-3.75-6.59-6.59l2.2-2.21c.28-.26.36-.65.25-1C8.7 6.45 8.5 5.25 8.5 4c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1 0 9.39 7.61 17 17 17 .55 0 1-.45 1-1v-3.5c0-.55-.45-1-1-1z"></path></g>
<g id="phone-in-talk"><path d="M20 15.5c-1.25 0-2.45-.2-3.57-.57-.35-.11-.74-.03-1.02.24l-2.2 2.2c-2.83-1.44-5.15-3.75-6.59-6.59l2.2-2.21c.28-.26.36-.65.25-1C8.7 6.45 8.5 5.25 8.5 4c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1 0 9.39 7.61 17 17 17 .55 0 1-.45 1-1v-3.5c0-.55-.45-1-1-1zM19 12h2c0-4.97-4.03-9-9-9v2c3.87 0 7 3.13 7 7zm-4 0h2c0-2.76-2.24-5-5-5v2c1.66 0 3 1.34 3 3z"></path></g>
<g id="phone-locked"><path d="M20 15.5c-1.25 0-2.45-.2-3.57-.57-.35-.11-.74-.03-1.02.24l-2.2 2.2c-2.83-1.44-5.15-3.75-6.59-6.59l2.2-2.21c.28-.26.36-.65.25-1C8.7 6.45 8.5 5.25 8.5 4c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1 0 9.39 7.61 17 17 17 .55 0 1-.45 1-1v-3.5c0-.55-.45-1-1-1zM20 4v-.5C20 2.12 18.88 1 17.5 1S15 2.12 15 3.5V4c-.55 0-1 .45-1 1v4c0 .55.45 1 1 1h5c.55 0 1-.45 1-1V5c0-.55-.45-1-1-1zm-.8 0h-3.4v-.5c0-.94.76-1.7 1.7-1.7s1.7.76 1.7 1.7V4z"></path></g>
<g id="phone-missed"><path d="M6.5 5.5L12 11l7-7-1-1-6 6-4.5-4.5H11V3H5v6h1.5V5.5zm17.21 11.17C20.66 13.78 16.54 12 12 12 7.46 12 3.34 13.78.29 16.67c-.18.18-.29.43-.29.71s.11.53.29.71l2.48 2.48c.18.18.43.29.71.29.27 0 .52-.11.7-.28.79-.74 1.69-1.36 2.66-1.85.33-.16.56-.5.56-.9v-3.1c1.45-.48 3-.73 4.6-.73 1.6 0 3.15.25 4.6.72v3.1c0 .39.23.74.56.9.98.49 1.87 1.12 2.67 1.85.18.18.43.28.7.28.28 0 .53-.11.71-.29l2.48-2.48c.18-.18.29-.43.29-.71s-.12-.52-.3-.7z"></path></g>
<g id="phone-paused"><path d="M17 3h-2v7h2V3zm3 12.5c-1.25 0-2.45-.2-3.57-.57-.35-.11-.74-.03-1.02.24l-2.2 2.2c-2.83-1.44-5.15-3.75-6.59-6.59l2.2-2.21c.28-.26.36-.65.25-1C8.7 6.45 8.5 5.25 8.5 4c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1 0 9.39 7.61 17 17 17 .55 0 1-.45 1-1v-3.5c0-.55-.45-1-1-1zM19 3v7h2V3h-2z"></path></g>
<g id="power"><path d="M16.01 7L16 3h-2v4h-4V3H8v4h-.01C7 6.99 6 7.99 6 8.99v5.49L9.5 18v3h5v-3l3.5-3.51v-5.5c0-1-1-2-1.99-1.99z"></path></g>
<g id="priority-high"><circle cx="12" cy="19" r="2"></circle><path d="M10 3h4v12h-4z"></path></g>
<g id="rv-hookup"><path d="M20 17v-6c0-1.1-.9-2-2-2H7V7l-3 3 3 3v-2h4v3H4v3c0 1.1.9 2 2 2h2c0 1.66 1.34 3 3 3s3-1.34 3-3h8v-2h-2zm-9 3c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm7-6h-4v-3h4v3zM17 2v2H9v2h8v2l3-3z"></path></g>
<g id="sd-card"><path d="M18 2h-8L4.02 8 4 20c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-6 6h-2V4h2v4zm3 0h-2V4h2v4zm3 0h-2V4h2v4z"></path></g>
<g id="sim-card-alert"><path d="M18 2h-8L4.02 8 4 20c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-5 15h-2v-2h2v2zm0-4h-2V8h2v5z"></path></g>
<g id="sms"><path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM9 11H7V9h2v2zm4 0h-2V9h2v2zm4 0h-2V9h2v2z"></path></g>
<g id="sms-failed"><path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-7 12h-2v-2h2v2zm0-4h-2V6h2v4z"></path></g>
<g id="sync"><path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46C19.54 15.03 20 13.57 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74C4.46 8.97 4 10.43 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z"></path></g>
<g id="sync-disabled"><path d="M10 6.35V4.26c-.8.21-1.55.54-2.23.96l1.46 1.46c.25-.12.5-.24.77-.33zm-7.14-.94l2.36 2.36C4.45 8.99 4 10.44 4 12c0 2.21.91 4.2 2.36 5.64L4 20h6v-6l-2.24 2.24C6.68 15.15 6 13.66 6 12c0-1 .25-1.94.68-2.77l8.08 8.08c-.25.13-.5.25-.77.34v2.09c.8-.21 1.55-.54 2.23-.96l2.36 2.36 1.27-1.27L4.14 4.14 2.86 5.41zM20 4h-6v6l2.24-2.24C17.32 8.85 18 10.34 18 12c0 1-.25 1.94-.68 2.77l1.46 1.46C19.55 15.01 20 13.56 20 12c0-2.21-.91-4.2-2.36-5.64L20 4z"></path></g>
<g id="sync-problem"><path d="M3 12c0 2.21.91 4.2 2.36 5.64L3 20h6v-6l-2.24 2.24C5.68 15.15 5 13.66 5 12c0-2.61 1.67-4.83 4-5.65V4.26C5.55 5.15 3 8.27 3 12zm8 5h2v-2h-2v2zM21 4h-6v6l2.24-2.24C18.32 8.85 19 10.34 19 12c0 2.61-1.67 4.83-4 5.65v2.09c3.45-.89 6-4.01 6-7.74 0-2.21-.91-4.2-2.36-5.64L21 4zm-10 9h2V7h-2v6z"></path></g>
<g id="system-update"><path d="M17 1.01L7 1c-1.1 0-2 .9-2 2v18c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V3c0-1.1-.9-1.99-2-1.99zM17 19H7V5h10v14zm-1-6h-3V8h-2v5H8l4 4 4-4z"></path></g>
<g id="tap-and-play"><path d="M2 16v2c2.76 0 5 2.24 5 5h2c0-3.87-3.13-7-7-7zm0 4v3h3c0-1.66-1.34-3-3-3zm0-8v2c4.97 0 9 4.03 9 9h2c0-6.08-4.92-11-11-11zM17 1.01L7 1c-1.1 0-2 .9-2 2v7.37c.69.16 1.36.37 2 .64V5h10v13h-3.03c.52 1.25.84 2.59.95 4H17c1.1 0 2-.9 2-2V3c0-1.1-.9-1.99-2-1.99z"></path></g>
<g id="time-to-leave"><path d="M18.92 5.01C18.72 4.42 18.16 4 17.5 4h-11c-.66 0-1.21.42-1.42 1.01L3 11v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 15c-.83 0-1.5-.67-1.5-1.5S5.67 12 6.5 12s1.5.67 1.5 1.5S7.33 15 6.5 15zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 10l1.5-4.5h11L19 10H5z"></path></g>
<g id="vibration"><path d="M0 15h2V9H0v6zm3 2h2V7H3v10zm19-8v6h2V9h-2zm-3 8h2V7h-2v10zM16.5 3h-9C6.67 3 6 3.67 6 4.5v15c0 .83.67 1.5 1.5 1.5h9c.83 0 1.5-.67 1.5-1.5v-15c0-.83-.67-1.5-1.5-1.5zM16 19H8V5h8v14z"></path></g>
<g id="voice-chat"><path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12l-4-3.2V14H6V6h8v3.2L18 6v8z"></path></g>
<g id="vpn-lock"><path d="M22 4v-.5C22 2.12 20.88 1 19.5 1S17 2.12 17 3.5V4c-.55 0-1 .45-1 1v4c0 .55.45 1 1 1h5c.55 0 1-.45 1-1V5c0-.55-.45-1-1-1zm-.8 0h-3.4v-.5c0-.94.76-1.7 1.7-1.7s1.7.76 1.7 1.7V4zm-2.28 8c.04.33.08.66.08 1 0 2.08-.8 3.97-2.1 5.39-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H7v-2h2c.55 0 1-.45 1-1V8h2c1.1 0 2-.9 2-2V3.46c-.95-.3-1.95-.46-3-.46C5.48 3 1 7.48 1 13s4.48 10 10 10 10-4.48 10-10c0-.34-.02-.67-.05-1h-2.03zM10 20.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L8 16v1c0 1.1.9 2 2 2v1.93z"></path></g>
<g id="wc"><path d="M5.5 22v-7.5H4V9c0-1.1.9-2 2-2h3c1.1 0 2 .9 2 2v5.5H9.5V22h-4zM18 22v-6h3l-2.54-7.63C18.18 7.55 17.42 7 16.56 7h-.12c-.86 0-1.63.55-1.9 1.37L12 16h3v6h3zM7.5 6c1.11 0 2-.89 2-2s-.89-2-2-2-2 .89-2 2 .89 2 2 2zm9 0c1.11 0 2-.89 2-2s-.89-2-2-2-2 .89-2 2 .89 2 2 2z"></path></g>
<g id="wifi"><path d="M1 9l2 2c4.97-4.97 13.03-4.97 18 0l2-2C16.93 2.93 7.08 2.93 1 9zm8 8l3 3 3-3c-1.65-1.66-4.34-1.66-6 0zm-4-4l2 2c2.76-2.76 7.24-2.76 10 0l2-2C15.14 9.14 8.87 9.14 5 13z"></path></g>
</defs></svg>
</iron-iconset-svg>`;
document.head.appendChild(template$2.content); /// BareSpecifier=@polymer\iron-input\iron-input

Polymer({
  _template: html`
    <style>
      :host {
        display: inline-block;
      }
    </style>
    <slot id="content"></slot>
`,
  is: 'iron-input',
  behaviors: [IronValidatableBehavior],
  /**
   * Fired whenever `validate()` is called.
   *
   * @event iron-input-validate
   */properties: {
    /**
     * Use this property instead of `value` for two-way data binding, or to
     * set a default value for the input. **Do not** use the distributed
     * input's `value` property to set a default value.
     */bindValue: {
      type: String,
      value: ''
    },
    /**
     * Computed property that echoes `bindValue` (mostly used for Polymer 1.0
     * backcompatibility, if you were one-way binding to the Polymer 1.0
     * `input is="iron-input"` value attribute).
     */value: {
      type: String,
      computed: '_computeValue(bindValue)'
    },
    /**
     * Regex-like list of characters allowed as input; all characters not in the
     * list will be rejected. The recommended format should be a list of allowed
     * characters, for example, `[a-zA-Z0-9.+-!;:]`.
     *
     * This pattern represents the allowed characters for the field; as the user
     * inputs text, each individual character will be checked against the
     * pattern (rather than checking the entire value as a whole). If a
     * character is not a match, it will be rejected.
     *
     * Pasted input will have each character checked individually; if any
     * character doesn't match `allowedPattern`, the entire pasted string will
     * be rejected.
     *
     * Note: if you were using `iron-input` in 1.0, you were also required to
     * set `prevent-invalid-input`. This is no longer needed as of Polymer 2.0,
     * and will be set automatically for you if an `allowedPattern` is provided.
     *
     */allowedPattern: {
      type: String
    },
    /**
     * Set to true to auto-validate the input value as you type.
     */autoValidate: {
      type: Boolean,
      value: false
    },
    /**
     * The native input element.
     */_inputElement: Object
  },
  observers: ['_bindValueChanged(bindValue, _inputElement)'],
  listeners: {
    'input': '_onInput',
    'keypress': '_onKeypress'
  },
  created: function () {
    IronA11yAnnouncer.requestAvailability();
    this._previousValidInput = '';
    this._patternAlreadyChecked = false;
  },
  attached: function () {
    // If the input is added at a later time, update the internal reference.
    this._observer = dom(this).observeNodes(function (info) {
      this._initSlottedInput();
    }.bind(this));
  },
  detached: function () {
    if (this._observer) {
      dom(this).unobserveNodes(this._observer);
      this._observer = null;
    }
  },

  /**
   * Returns the distributed input element.
   */get inputElement() {
    return this._inputElement;
  },

  _initSlottedInput: function () {
    this._inputElement = this.getEffectiveChildren()[0];

    if (this.inputElement && this.inputElement.value) {
      this.bindValue = this.inputElement.value;
    }

    this.fire('iron-input-ready');
  },

  get _patternRegExp() {
    var pattern;

    if (this.allowedPattern) {
      pattern = new RegExp(this.allowedPattern);
    } else {
      switch (this.inputElement.type) {
        case 'number':
          pattern = /[0-9.,e-]/;
          break;
      }
    }

    return pattern;
  },

  /**
   * @suppress {checkTypes}
   */_bindValueChanged: function (bindValue, inputElement) {
    // The observer could have run before attached() when we have actually
    // initialized this property.
    if (!inputElement) {
      return;
    }

    if (bindValue === undefined) {
      inputElement.value = null;
    } else if (bindValue !== inputElement.value) {
      this.inputElement.value = bindValue;
    }

    if (this.autoValidate) {
      this.validate();
    } // manually notify because we don't want to notify until after setting value


    this.fire('bind-value-changed', {
      value: bindValue
    });
  },
  _onInput: function () {
    // Need to validate each of the characters pasted if they haven't
    // been validated inside `_onKeypress` already.
    if (this.allowedPattern && !this._patternAlreadyChecked) {
      var valid = this._checkPatternValidity();

      if (!valid) {
        this._announceInvalidCharacter('Invalid string of characters not entered.');

        this.inputElement.value = this._previousValidInput;
      }
    }

    this.bindValue = this._previousValidInput = this.inputElement.value;
    this._patternAlreadyChecked = false;
  },
  _isPrintable: function (event) {
    // What a control/printable character is varies wildly based on the browser.
    // - most control characters (arrows, backspace) do not send a `keypress`
    // event
    //   in Chrome, but the *do* on Firefox
    // - in Firefox, when they do send a `keypress` event, control chars have
    //   a charCode = 0, keyCode = xx (for ex. 40 for down arrow)
    // - printable characters always send a keypress event.
    // - in Firefox, printable chars always have a keyCode = 0. In Chrome, the
    // keyCode
    //   always matches the charCode.
    // None of this makes any sense.
    // For these keys, ASCII code == browser keycode.
    var anyNonPrintable = event.keyCode == 8 || // backspace
    event.keyCode == 9 || // tab
    event.keyCode == 13 || // enter
    event.keyCode == 27; // escape
    // For these keys, make sure it's a browser keycode and not an ASCII code.

    var mozNonPrintable = event.keyCode == 19 || // pause
    event.keyCode == 20 || // caps lock
    event.keyCode == 45 || // insert
    event.keyCode == 46 || // delete
    event.keyCode == 144 || // num lock
    event.keyCode == 145 || // scroll lock
    event.keyCode > 32 && event.keyCode < 41 || // page up/down, end, home, arrows
    event.keyCode > 111 && event.keyCode < 124; // fn keys

    return !anyNonPrintable && !(event.charCode == 0 && mozNonPrintable);
  },
  _onKeypress: function (event) {
    if (!this.allowedPattern && this.inputElement.type !== 'number') {
      return;
    }

    var regexp = this._patternRegExp;

    if (!regexp) {
      return;
    } // Handle special keys and backspace


    if (event.metaKey || event.ctrlKey || event.altKey) {
      return;
    } // Check the pattern either here or in `_onInput`, but not in both.


    this._patternAlreadyChecked = true;
    var thisChar = String.fromCharCode(event.charCode);

    if (this._isPrintable(event) && !regexp.test(thisChar)) {
      event.preventDefault();

      this._announceInvalidCharacter('Invalid character ' + thisChar + ' not entered.');
    }
  },
  _checkPatternValidity: function () {
    var regexp = this._patternRegExp;

    if (!regexp) {
      return true;
    }

    for (var i = 0; i < this.inputElement.value.length; i++) {
      if (!regexp.test(this.inputElement.value[i])) {
        return false;
      }
    }

    return true;
  },
  /**
   * Returns true if `value` is valid. The validator provided in `validator`
   * will be used first, then any constraints.
   * @return {boolean} True if the value is valid.
   */validate: function () {
    if (!this.inputElement) {
      this.invalid = false;
      return true;
    } // Use the nested input's native validity.


    var valid = this.inputElement.checkValidity(); // Only do extra checking if the browser thought this was valid.

    if (valid) {
      // Empty, required input is invalid
      if (this.required && this.bindValue === '') {
        valid = false;
      } else if (this.hasValidator()) {
        valid = IronValidatableBehavior.validate.call(this, this.bindValue);
      }
    }

    this.invalid = !valid;
    this.fire('iron-input-validate');
    return valid;
  },
  _announceInvalidCharacter: function (message) {
    this.fire('iron-announce', {
      text: message
    });
  },
  _computeValue: function (bindValue) {
    return bindValue;
  }
}); /// BareSpecifier=@polymer\iron-selector\iron-selection

class IronSelection {
  /**
   * @param {!Function} selectCallback
   * @suppress {missingProvide}
   */constructor(selectCallback) {
    this.selection = [];
    this.selectCallback = selectCallback;
  } /**
     * Retrieves the selected item(s).
     *
     * @returns Returns the selected item(s). If the multi property is true,
     * `get` will return an array, otherwise it will return
     * the selected item or undefined if there is no selection.
     */

  get() {
    return this.multi ? this.selection.slice() : this.selection[0];
  } /**
     * Clears all the selection except the ones indicated.
     *
     * @param {Array} excludes items to be excluded.
     */

  clear(excludes) {
    this.selection.slice().forEach(function (item) {
      if (!excludes || excludes.indexOf(item) < 0) {
        this.setItemSelected(item, false);
      }
    }, this);
  } /**
     * Indicates if a given item is selected.
     *
     * @param {*} item The item whose selection state should be checked.
     * @return {boolean} Returns true if `item` is selected.
     */

  isSelected(item) {
    return this.selection.indexOf(item) >= 0;
  } /**
     * Sets the selection state for a given item to either selected or deselected.
     *
     * @param {*} item The item to select.
     * @param {boolean} isSelected True for selected, false for deselected.
     */

  setItemSelected(item, isSelected) {
    if (item != null) {
      if (isSelected !== this.isSelected(item)) {
        // proceed to update selection only if requested state differs from
        // current
        if (isSelected) {
          this.selection.push(item);
        } else {
          var i = this.selection.indexOf(item);

          if (i >= 0) {
            this.selection.splice(i, 1);
          }
        }

        if (this.selectCallback) {
          this.selectCallback(item, isSelected);
        }
      }
    }
  } /**
     * Sets the selection state for a given item. If the `multi` property
     * is true, then the selected state of `item` will be toggled; otherwise
     * the `item` will be selected.
     *
     * @param {*} item The item to select.
     */

  select(item) {
    if (this.multi) {
      this.toggle(item);
    } else if (this.get() !== item) {
      this.setItemSelected(this.get(), false);
      this.setItemSelected(item, true);
    }
  } /**
     * Toggles the selection state for `item`.
     *
     * @param {*} item The item to toggle.
     */

  toggle(item) {
    this.setItemSelected(item, !this.isSelected(item));
  }

}

var ironSelection = {
  IronSelection: IronSelection
}; /// BareSpecifier=@polymer\iron-selector\iron-selectable

const IronSelectableBehavior = {
  /**
   * Fired when iron-selector is activated (selected or deselected).
   * It is fired before the selected items are changed.
   * Cancel the event to abort selection.
   *
   * @event iron-activate
   */ /**
       * Fired when an item is selected
       *
       * @event iron-select
       */ /**
           * Fired when an item is deselected
           *
           * @event iron-deselect
           */ /**
               * Fired when the list of selectable items changes (e.g., items are
               * added or removed). The detail of the event is a mutation record that
               * describes what changed.
               *
               * @event iron-items-changed
               */properties: {
    /**
     * If you want to use an attribute value or property of an element for
     * `selected` instead of the index, set this to the name of the attribute
     * or property. Hyphenated values are converted to camel case when used to
     * look up the property of a selectable element. Camel cased values are
     * *not* converted to hyphenated values for attribute lookup. It's
     * recommended that you provide the hyphenated form of the name so that
     * selection works in both cases. (Use `attr-or-property-name` instead of
     * `attrOrPropertyName`.)
     */attrForSelected: {
      type: String,
      value: null
    },
    /**
     * Gets or sets the selected element. The default is to use the index of the
     * item.
     * @type {string|number}
     */selected: {
      type: String,
      notify: true
    },
    /**
     * Returns the currently selected item.
     *
     * @type {?Object}
     */selectedItem: {
      type: Object,
      readOnly: true,
      notify: true
    },
    /**
     * The event that fires from items when they are selected. Selectable
     * will listen for this event from items and update the selection state.
     * Set to empty string to listen to no events.
     */activateEvent: {
      type: String,
      value: 'tap',
      observer: '_activateEventChanged'
    },
    /**
     * This is a CSS selector string.  If this is set, only items that match the
     * CSS selector are selectable.
     */selectable: String,
    /**
     * The class to set on elements when selected.
     */selectedClass: {
      type: String,
      value: 'iron-selected'
    },
    /**
     * The attribute to set on elements when selected.
     */selectedAttribute: {
      type: String,
      value: null
    },
    /**
     * Default fallback if the selection based on selected with
     * `attrForSelected` is not found.
     */fallbackSelection: {
      type: String,
      value: null
    },
    /**
     * The list of items from which a selection can be made.
     */items: {
      type: Array,
      readOnly: true,
      notify: true,
      value: function () {
        return [];
      }
    },
    /**
     * The set of excluded elements where the key is the `localName`
     * of the element that will be ignored from the item list.
     *
     * @default {template: 1}
     */_excludedLocalNames: {
      type: Object,
      value: function () {
        return {
          'template': 1,
          'dom-bind': 1,
          'dom-if': 1,
          'dom-repeat': 1
        };
      }
    }
  },
  observers: ['_updateAttrForSelected(attrForSelected)', '_updateSelected(selected)', '_checkFallback(fallbackSelection)'],
  created: function () {
    this._bindFilterItem = this._filterItem.bind(this);
    this._selection = new IronSelection(this._applySelection.bind(this));
  },
  attached: function () {
    this._observer = this._observeItems(this);

    this._addListener(this.activateEvent);
  },
  detached: function () {
    if (this._observer) {
      dom(this).unobserveNodes(this._observer);
    }

    this._removeListener(this.activateEvent);
  },
  /**
   * Returns the index of the given item.
   *
   * @method indexOf
   * @param {Object} item
   * @returns Returns the index of the item
   */indexOf: function (item) {
    return this.items ? this.items.indexOf(item) : -1;
  },
  /**
   * Selects the given value.
   *
   * @method select
   * @param {string|number} value the value to select.
   */select: function (value) {
    this.selected = value;
  },
  /**
   * Selects the previous item.
   *
   * @method selectPrevious
   */selectPrevious: function () {
    var length = this.items.length;
    var index = length - 1;

    if (this.selected !== undefined) {
      index = (Number(this._valueToIndex(this.selected)) - 1 + length) % length;
    }

    this.selected = this._indexToValue(index);
  },
  /**
   * Selects the next item.
   *
   * @method selectNext
   */selectNext: function () {
    var index = 0;

    if (this.selected !== undefined) {
      index = (Number(this._valueToIndex(this.selected)) + 1) % this.items.length;
    }

    this.selected = this._indexToValue(index);
  },
  /**
   * Selects the item at the given index.
   *
   * @method selectIndex
   */selectIndex: function (index) {
    this.select(this._indexToValue(index));
  },
  /**
   * Force a synchronous update of the `items` property.
   *
   * NOTE: Consider listening for the `iron-items-changed` event to respond to
   * updates to the set of selectable items after updates to the DOM list and
   * selection state have been made.
   *
   * WARNING: If you are using this method, you should probably consider an
   * alternate approach. Synchronously querying for items is potentially
   * slow for many use cases. The `items` property will update asynchronously
   * on its own to reflect selectable items in the DOM.
   */forceSynchronousItemUpdate: function () {
    if (this._observer && typeof this._observer.flush === 'function') {
      // NOTE(bicknellr): `dom.flush` above is no longer sufficient to trigger
      // `observeNodes` callbacks. Polymer 2.x returns an object from
      // `observeNodes` with a `flush` that synchronously gives the callback any
      // pending MutationRecords (retrieved with `takeRecords`). Any case where
      // ShadyDOM flushes were expected to synchronously trigger item updates
      // will now require calling `forceSynchronousItemUpdate`.
      this._observer.flush();
    } else {
      this._updateItems();
    }
  },

  // UNUSED, FOR API COMPATIBILITY
  get _shouldUpdateSelection() {
    return this.selected != null;
  },

  _checkFallback: function () {
    this._updateSelected();
  },
  _addListener: function (eventName) {
    this.listen(this, eventName, '_activateHandler');
  },
  _removeListener: function (eventName) {
    this.unlisten(this, eventName, '_activateHandler');
  },
  _activateEventChanged: function (eventName, old) {
    this._removeListener(old);

    this._addListener(eventName);
  },
  _updateItems: function () {
    var nodes = dom(this).queryDistributedElements(this.selectable || '*');
    nodes = Array.prototype.filter.call(nodes, this._bindFilterItem);

    this._setItems(nodes);
  },
  _updateAttrForSelected: function () {
    if (this.selectedItem) {
      this.selected = this._valueForItem(this.selectedItem);
    }
  },
  _updateSelected: function () {
    this._selectSelected(this.selected);
  },
  _selectSelected: function (selected) {
    if (!this.items) {
      return;
    }

    var item = this._valueToItem(this.selected);

    if (item) {
      this._selection.select(item);
    } else {
      this._selection.clear();
    } // Check for items, since this array is populated only when attached
    // Since Number(0) is falsy, explicitly check for undefined


    if (this.fallbackSelection && this.items.length && this._selection.get() === undefined) {
      this.selected = this.fallbackSelection;
    }
  },
  _filterItem: function (node) {
    return !this._excludedLocalNames[node.localName];
  },
  _valueToItem: function (value) {
    return value == null ? null : this.items[this._valueToIndex(value)];
  },
  _valueToIndex: function (value) {
    if (this.attrForSelected) {
      for (var i = 0, item; item = this.items[i]; i++) {
        if (this._valueForItem(item) == value) {
          return i;
        }
      }
    } else {
      return Number(value);
    }
  },
  _indexToValue: function (index) {
    if (this.attrForSelected) {
      var item = this.items[index];

      if (item) {
        return this._valueForItem(item);
      }
    } else {
      return index;
    }
  },
  _valueForItem: function (item) {
    if (!item) {
      return null;
    }

    if (!this.attrForSelected) {
      var i = this.indexOf(item);
      return i === -1 ? null : i;
    }

    var propValue = item[dashToCamelCase(this.attrForSelected)];
    return propValue != undefined ? propValue : item.getAttribute(this.attrForSelected);
  },
  _applySelection: function (item, isSelected) {
    if (this.selectedClass) {
      this.toggleClass(this.selectedClass, isSelected, item);
    }

    if (this.selectedAttribute) {
      this.toggleAttribute(this.selectedAttribute, isSelected, item);
    }

    this._selectionChange();

    this.fire('iron-' + (isSelected ? 'select' : 'deselect'), {
      item: item
    });
  },
  _selectionChange: function () {
    this._setSelectedItem(this._selection.get());
  },
  // observe items change under the given node.
  _observeItems: function (node) {
    return dom(node).observeNodes(function (mutation) {
      this._updateItems();

      this._updateSelected(); // Let other interested parties know about the change so that
      // we don't have to recreate mutation observers everywhere.


      this.fire('iron-items-changed', mutation, {
        bubbles: false,
        cancelable: false
      });
    });
  },
  _activateHandler: function (e) {
    var t = e.target;
    var items = this.items;

    while (t && t != this) {
      var i = items.indexOf(t);

      if (i >= 0) {
        var value = this._indexToValue(i);

        this._itemActivate(value, t);

        return;
      }

      t = t.parentNode;
    }
  },
  _itemActivate: function (value, item) {
    if (!this.fire('iron-activate', {
      selected: value,
      item: item
    }, {
      cancelable: true
    }).defaultPrevented) {
      this.select(value);
    }
  }
};
var ironSelectable = {
  IronSelectableBehavior: IronSelectableBehavior
}; /// BareSpecifier=@polymer\iron-selector\iron-multi-selectable

const IronMultiSelectableBehaviorImpl = {
  properties: {
    /**
     * If true, multiple selections are allowed.
     */multi: {
      type: Boolean,
      value: false,
      observer: 'multiChanged'
    },
    /**
     * Gets or sets the selected elements. This is used instead of `selected`
     * when `multi` is true.
     */selectedValues: {
      type: Array,
      notify: true,
      value: function () {
        return [];
      }
    },
    /**
     * Returns an array of currently selected items.
     */selectedItems: {
      type: Array,
      readOnly: true,
      notify: true,
      value: function () {
        return [];
      }
    }
  },
  observers: ['_updateSelected(selectedValues.splices)'],
  /**
   * Selects the given value. If the `multi` property is true, then the selected
   * state of the `value` will be toggled; otherwise the `value` will be
   * selected.
   *
   * @method select
   * @param {string|number} value the value to select.
   */select: function (value) {
    if (this.multi) {
      this._toggleSelected(value);
    } else {
      this.selected = value;
    }
  },
  multiChanged: function (multi) {
    this._selection.multi = multi;

    this._updateSelected();
  },

  // UNUSED, FOR API COMPATIBILITY
  get _shouldUpdateSelection() {
    return this.selected != null || this.selectedValues != null && this.selectedValues.length;
  },

  _updateAttrForSelected: function () {
    if (!this.multi) {
      IronSelectableBehavior._updateAttrForSelected.apply(this);
    } else if (this.selectedItems && this.selectedItems.length > 0) {
      this.selectedValues = this.selectedItems.map(function (selectedItem) {
        return this._indexToValue(this.indexOf(selectedItem));
      }, this).filter(function (unfilteredValue) {
        return unfilteredValue != null;
      }, this);
    }
  },
  _updateSelected: function () {
    if (this.multi) {
      this._selectMulti(this.selectedValues);
    } else {
      this._selectSelected(this.selected);
    }
  },
  _selectMulti: function (values) {
    values = values || [];
    var selectedItems = (this._valuesToItems(values) || []).filter(function (item) {
      return item !== null && item !== undefined;
    }); // clear all but the current selected items

    this._selection.clear(selectedItems); // select only those not selected yet


    for (var i = 0; i < selectedItems.length; i++) {
      this._selection.setItemSelected(selectedItems[i], true);
    } // Check for items, since this array is populated only when attached


    if (this.fallbackSelection && !this._selection.get().length) {
      var fallback = this._valueToItem(this.fallbackSelection);

      if (fallback) {
        this.select(this.fallbackSelection);
      }
    }
  },
  _selectionChange: function () {
    var s = this._selection.get();

    if (this.multi) {
      this._setSelectedItems(s);

      this._setSelectedItem(s.length ? s[0] : null);
    } else {
      if (s !== null && s !== undefined) {
        this._setSelectedItems([s]);

        this._setSelectedItem(s);
      } else {
        this._setSelectedItems([]);

        this._setSelectedItem(null);
      }
    }
  },
  _toggleSelected: function (value) {
    var i = this.selectedValues.indexOf(value);
    var unselected = i < 0;

    if (unselected) {
      this.push('selectedValues', value);
    } else {
      this.splice('selectedValues', i, 1);
    }
  },
  _valuesToItems: function (values) {
    return values == null ? null : values.map(function (value) {
      return this._valueToItem(value);
    }, this);
  }
}; /** @polymerBehavior */
const IronMultiSelectableBehavior = [IronSelectableBehavior, IronMultiSelectableBehaviorImpl];
var ironMultiSelectable = {
  IronMultiSelectableBehaviorImpl: IronMultiSelectableBehaviorImpl,
  IronMultiSelectableBehavior: IronMultiSelectableBehavior
}; /// BareSpecifier=@polymer\iron-menu-behavior\iron-menu-behavior

const IronMenuBehaviorImpl = {
  properties: {
    /**
     * Returns the currently focused item.
     * @type {?Object}
     */focusedItem: {
      observer: '_focusedItemChanged',
      readOnly: true,
      type: Object
    },
    /**
     * The attribute to use on menu items to look up the item title. Typing the
     * first letter of an item when the menu is open focuses that item. If
     * unset, `textContent` will be used.
     */attrForItemTitle: {
      type: String
    },
    /**
     * @type {boolean}
     */disabled: {
      type: Boolean,
      value: false,
      observer: '_disabledChanged'
    }
  },
  /**
   * The list of keys has been taken from
   * https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/getModifierState
   * @private
   */_MODIFIER_KEYS: ['Alt', 'AltGraph', 'CapsLock', 'Control', 'Fn', 'FnLock', 'Hyper', 'Meta', 'NumLock', 'OS', 'ScrollLock', 'Shift', 'Super', 'Symbol', 'SymbolLock'],
  /** @private */_SEARCH_RESET_TIMEOUT_MS: 1000,
  /** @private */_previousTabIndex: 0,
  hostAttributes: {
    'role': 'menu'
  },
  observers: ['_updateMultiselectable(multi)'],
  listeners: {
    'focus': '_onFocus',
    'keydown': '_onKeydown',
    'iron-items-changed': '_onIronItemsChanged'
  },
  /**
   * @type {!Object}
   */keyBindings: {
    'up': '_onUpKey',
    'down': '_onDownKey',
    'esc': '_onEscKey',
    'shift+tab:keydown': '_onShiftTabDown'
  },
  attached: function () {
    this._resetTabindices();
  },
  /**
   * Selects the given value. If the `multi` property is true, then the selected
   * state of the `value` will be toggled; otherwise the `value` will be
   * selected.
   *
   * @param {string|number} value the value to select.
   */select: function (value) {
    // Cancel automatically focusing a default item if the menu received focus
    // through a user action selecting a particular item.
    if (this._defaultFocusAsync) {
      this.cancelAsync(this._defaultFocusAsync);
      this._defaultFocusAsync = null;
    }

    var item = this._valueToItem(value);

    if (item && item.hasAttribute('disabled')) return;

    this._setFocusedItem(item);

    IronMultiSelectableBehaviorImpl.select.apply(this, arguments);
  },
  /**
   * Resets all tabindex attributes to the appropriate value based on the
   * current selection state. The appropriate value is `0` (focusable) for
   * the default selected item, and `-1` (not keyboard focusable) for all
   * other items.
   */_resetTabindices: function () {
    var selectedItem = this.multi ? this.selectedItems && this.selectedItems[0] : this.selectedItem;
    this.items.forEach(function (item) {
      item.setAttribute('tabindex', item === selectedItem ? '0' : '-1');
    }, this);
  },
  /**
   * Sets appropriate ARIA based on whether or not the menu is meant to be
   * multi-selectable.
   *
   * @param {boolean} multi True if the menu should be multi-selectable.
   */_updateMultiselectable: function (multi) {
    if (multi) {
      this.setAttribute('aria-multiselectable', 'true');
    } else {
      this.removeAttribute('aria-multiselectable');
    }
  },
  /**
   * Given a KeyboardEvent, this method will focus the appropriate item in the
   * menu (if there is a relevant item, and it is possible to focus it).
   *
   * @param {KeyboardEvent} event A KeyboardEvent.
   */_focusWithKeyboardEvent: function (event) {
    // Make sure that the key pressed is not a modifier key.
    // getModifierState is not being used, as it is not available in Safari
    // earlier than 10.0.2 (https://trac.webkit.org/changeset/206725/webkit)
    if (this._MODIFIER_KEYS.indexOf(event.key) !== -1) return;
    this.cancelDebouncer('_clearSearchText');
    var searchText = this._searchText || '';
    var key = event.key && event.key.length == 1 ? event.key : String.fromCharCode(event.keyCode);
    searchText += key.toLocaleLowerCase();
    var searchLength = searchText.length;

    for (var i = 0, item; item = this.items[i]; i++) {
      if (item.hasAttribute('disabled')) {
        continue;
      }

      var attr = this.attrForItemTitle || 'textContent';
      var title = (item[attr] || item.getAttribute(attr) || '').trim();

      if (title.length < searchLength) {
        continue;
      }

      if (title.slice(0, searchLength).toLocaleLowerCase() == searchText) {
        this._setFocusedItem(item);

        break;
      }
    }

    this._searchText = searchText;
    this.debounce('_clearSearchText', this._clearSearchText, this._SEARCH_RESET_TIMEOUT_MS);
  },
  _clearSearchText: function () {
    this._searchText = '';
  },
  /**
   * Focuses the previous item (relative to the currently focused item) in the
   * menu, disabled items will be skipped.
   * Loop until length + 1 to handle case of single item in menu.
   */_focusPrevious: function () {
    var length = this.items.length;
    var curFocusIndex = Number(this.indexOf(this.focusedItem));

    for (var i = 1; i < length + 1; i++) {
      var item = this.items[(curFocusIndex - i + length) % length];

      if (!item.hasAttribute('disabled')) {
        var owner = dom(item).getOwnerRoot() || document;

        this._setFocusedItem(item); // Focus might not have worked, if the element was hidden or not
        // focusable. In that case, try again.


        if (dom(owner).activeElement == item) {
          return;
        }
      }
    }
  },
  /**
   * Focuses the next item (relative to the currently focused item) in the
   * menu, disabled items will be skipped.
   * Loop until length + 1 to handle case of single item in menu.
   */_focusNext: function () {
    var length = this.items.length;
    var curFocusIndex = Number(this.indexOf(this.focusedItem));

    for (var i = 1; i < length + 1; i++) {
      var item = this.items[(curFocusIndex + i) % length];

      if (!item.hasAttribute('disabled')) {
        var owner = dom(item).getOwnerRoot() || document;

        this._setFocusedItem(item); // Focus might not have worked, if the element was hidden or not
        // focusable. In that case, try again.


        if (dom(owner).activeElement == item) {
          return;
        }
      }
    }
  },
  /**
   * Mutates items in the menu based on provided selection details, so that
   * all items correctly reflect selection state.
   *
   * @param {Element} item An item in the menu.
   * @param {boolean} isSelected True if the item should be shown in a
   * selected state, otherwise false.
   */_applySelection: function (item, isSelected) {
    if (isSelected) {
      item.setAttribute('aria-selected', 'true');
    } else {
      item.removeAttribute('aria-selected');
    }

    IronSelectableBehavior._applySelection.apply(this, arguments);
  },
  /**
   * Discretely updates tabindex values among menu items as the focused item
   * changes.
   *
   * @param {Element} focusedItem The element that is currently focused.
   * @param {?Element} old The last element that was considered focused, if
   * applicable.
   */_focusedItemChanged: function (focusedItem, old) {
    old && old.setAttribute('tabindex', '-1');

    if (focusedItem && !focusedItem.hasAttribute('disabled') && !this.disabled) {
      focusedItem.setAttribute('tabindex', '0');
      focusedItem.focus();
    }
  },
  /**
   * A handler that responds to mutation changes related to the list of items
   * in the menu.
   *
   * @param {CustomEvent} event An event containing mutation records as its
   * detail.
   */_onIronItemsChanged: function (event) {
    if (event.detail.addedNodes.length) {
      this._resetTabindices();
    }
  },
  /**
   * Handler that is called when a shift+tab keypress is detected by the menu.
   *
   * @param {CustomEvent} event A key combination event.
   */_onShiftTabDown: function (event) {
    var oldTabIndex = this.getAttribute('tabindex');
    IronMenuBehaviorImpl._shiftTabPressed = true;

    this._setFocusedItem(null);

    this.setAttribute('tabindex', '-1');
    this.async(function () {
      this.setAttribute('tabindex', oldTabIndex);
      IronMenuBehaviorImpl._shiftTabPressed = false; // NOTE(cdata): polymer/polymer#1305
    }, 1);
  },
  /**
   * Handler that is called when the menu receives focus.
   *
   * @param {FocusEvent} event A focus event.
   */_onFocus: function (event) {
    if (IronMenuBehaviorImpl._shiftTabPressed) {
      // do not focus the menu itself
      return;
    } // Do not focus the selected tab if the deepest target is part of the
    // menu element's local DOM and is focusable.


    var rootTarget = /** @type {?HTMLElement} */dom(event).rootTarget;

    if (rootTarget !== this && typeof rootTarget.tabIndex !== 'undefined' && !this.isLightDescendant(rootTarget)) {
      return;
    } // clear the cached focus item


    this._defaultFocusAsync = this.async(function () {
      // focus the selected item when the menu receives focus, or the first item
      // if no item is selected
      var selectedItem = this.multi ? this.selectedItems && this.selectedItems[0] : this.selectedItem;

      this._setFocusedItem(null);

      if (selectedItem) {
        this._setFocusedItem(selectedItem);
      } else if (this.items[0]) {
        // We find the first none-disabled item (if one exists)
        this._focusNext();
      }
    });
  },
  /**
   * Handler that is called when the up key is pressed.
   *
   * @param {CustomEvent} event A key combination event.
   */_onUpKey: function (event) {
    // up and down arrows moves the focus
    this._focusPrevious();

    event.detail.keyboardEvent.preventDefault();
  },
  /**
   * Handler that is called when the down key is pressed.
   *
   * @param {CustomEvent} event A key combination event.
   */_onDownKey: function (event) {
    this._focusNext();

    event.detail.keyboardEvent.preventDefault();
  },
  /**
   * Handler that is called when the esc key is pressed.
   *
   * @param {CustomEvent} event A key combination event.
   */_onEscKey: function (event) {
    var focusedItem = this.focusedItem;

    if (focusedItem) {
      focusedItem.blur();
    }
  },
  /**
   * Handler that is called when a keydown event is detected.
   *
   * @param {KeyboardEvent} event A keyboard event.
   */_onKeydown: function (event) {
    if (!this.keyboardEventMatchesKeys(event, 'up down esc')) {
      // all other keys focus the menu item starting with that character
      this._focusWithKeyboardEvent(event);
    }

    event.stopPropagation();
  },
  // override _activateHandler
  _activateHandler: function (event) {
    IronSelectableBehavior._activateHandler.call(this, event);

    event.stopPropagation();
  },
  /**
   * Updates this element's tab index when it's enabled/disabled.
   * @param {boolean} disabled
   */_disabledChanged: function (disabled) {
    if (disabled) {
      this._previousTabIndex = this.hasAttribute('tabindex') ? this.tabIndex : 0;
      this.removeAttribute('tabindex'); // No tabindex means not tab-able or select-able.
    } else if (!this.hasAttribute('tabindex')) {
      this.setAttribute('tabindex', this._previousTabIndex);
    }
  }
};
IronMenuBehaviorImpl._shiftTabPressed = false; /** @polymerBehavior */
const IronMenuBehavior = [IronMultiSelectableBehavior, IronA11yKeysBehavior, IronMenuBehaviorImpl];
var ironMenuBehavior = {
  IronMenuBehaviorImpl: IronMenuBehaviorImpl,
  IronMenuBehavior: IronMenuBehavior
}; /// BareSpecifier=@polymer\iron-menu-behavior\iron-menubar-behavior

const IronMenubarBehaviorImpl = {
  hostAttributes: {
    'role': 'menubar'
  },
  /**
   * @type {!Object}
   */keyBindings: {
    'left': '_onLeftKey',
    'right': '_onRightKey'
  },
  _onUpKey: function (event) {
    this.focusedItem.click();
    event.detail.keyboardEvent.preventDefault();
  },
  _onDownKey: function (event) {
    this.focusedItem.click();
    event.detail.keyboardEvent.preventDefault();
  },

  get _isRTL() {
    return window.getComputedStyle(this)['direction'] === 'rtl';
  },

  _onLeftKey: function (event) {
    if (this._isRTL) {
      this._focusNext();
    } else {
      this._focusPrevious();
    }

    event.detail.keyboardEvent.preventDefault();
  },
  _onRightKey: function (event) {
    if (this._isRTL) {
      this._focusPrevious();
    } else {
      this._focusNext();
    }

    event.detail.keyboardEvent.preventDefault();
  },
  _onKeydown: function (event) {
    if (this.keyboardEventMatchesKeys(event, 'up down left right esc')) {
      return;
    } // all other keys focus the menu item starting with that character


    this._focusWithKeyboardEvent(event);
  }
}; /** @polymerBehavior */
const IronMenubarBehavior = [IronMenuBehavior, IronMenubarBehaviorImpl];
var ironMenubarBehavior = {
  IronMenubarBehaviorImpl: IronMenubarBehaviorImpl,
  IronMenubarBehavior: IronMenubarBehavior
}; /// BareSpecifier=@polymer\iron-range-behavior\iron-range-behavior

const IronRangeBehavior = {
  properties: {
    /**
     * The number that represents the current value.
     */value: {
      type: Number,
      value: 0,
      notify: true,
      reflectToAttribute: true
    },
    /**
     * The number that indicates the minimum value of the range.
     */min: {
      type: Number,
      value: 0,
      notify: true
    },
    /**
     * The number that indicates the maximum value of the range.
     */max: {
      type: Number,
      value: 100,
      notify: true
    },
    /**
     * Specifies the value granularity of the range's value.
     */step: {
      type: Number,
      value: 1,
      notify: true
    },
    /**
     * Returns the ratio of the value.
     */ratio: {
      type: Number,
      value: 0,
      readOnly: true,
      notify: true
    }
  },
  observers: ['_update(value, min, max, step)'],
  _calcRatio: function (value) {
    return (this._clampValue(value) - this.min) / (this.max - this.min);
  },
  _clampValue: function (value) {
    return Math.min(this.max, Math.max(this.min, this._calcStep(value)));
  },
  _calcStep: function (value) {
    // polymer/issues/2493
    value = parseFloat(value);

    if (!this.step) {
      return value;
    }

    var numSteps = Math.round((value - this.min) / this.step);

    if (this.step < 1) {
      /**
       * For small values of this.step, if we calculate the step using
       * `Math.round(value / step) * step` we may hit a precision point issue
       * eg. 0.1 * 0.2 =  0.020000000000000004
       * http://docs.oracle.com/cd/E19957-01/806-3568/ncg_goldberg.html
       *
       * as a work around we can divide by the reciprocal of `step`
       */return numSteps / (1 / this.step) + this.min;
    } else {
      return numSteps * this.step + this.min;
    }
  },
  _validateValue: function () {
    var v = this._clampValue(this.value);

    this.value = this.oldValue = isNaN(v) ? this.oldValue : v;
    return this.value !== v;
  },
  _update: function () {
    this._validateValue();

    this._setRatio(this._calcRatio(this.value) * 100);
  }
};
var ironRangeBehavior = {
  IronRangeBehavior: IronRangeBehavior
}; /// BareSpecifier=@polymer\neon-animation\neon-animation-behavior

const NeonAnimationBehavior = {
  properties: {
    /**
     * Defines the animation timing.
     */animationTiming: {
      type: Object,
      value: function () {
        return {
          duration: 500,
          easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
          fill: 'both'
        };
      }
    }
  },
  /**
   * Can be used to determine that elements implement this behavior.
   */isNeonAnimation: true,
  /**
   * Do any animation configuration here.
   */ // configure: function(config) {
  // },
  created: function () {
    if (!document.body.animate) {
      console.warn('No web animations detected. This element will not' + ' function without a web animations polyfill.');
    }
  },
  /**
   * Returns the animation timing by mixing in properties from `config` to the
   * defaults defined by the animation.
   */timingFromConfig: function (config) {
    if (config.timing) {
      for (var property in config.timing) {
        this.animationTiming[property] = config.timing[property];
      }
    }

    return this.animationTiming;
  },
  /**
   * Sets `transform` and `transformOrigin` properties along with the prefixed
   * versions.
   */setPrefixedProperty: function (node, property, value) {
    var map = {
      'transform': ['webkitTransform'],
      'transformOrigin': ['mozTransformOrigin', 'webkitTransformOrigin']
    };
    var prefixes = map[property];

    for (var prefix, index = 0; prefix = prefixes[index]; index++) {
      node.style[prefix] = value;
    }

    node.style[property] = value;
  },
  /**
   * Called when the animation finishes.
   */complete: function (config) {}
};
var neonAnimationBehavior = {
  NeonAnimationBehavior: NeonAnimationBehavior
}; /// BareSpecifier=@polymer\neon-animation\animations\fade-in-animation

Polymer({
  is: 'fade-in-animation',
  behaviors: [NeonAnimationBehavior],
  configure: function (config) {
    var node = config.node;
    this._effect = new KeyframeEffect(node, [{
      'opacity': '0'
    }, {
      'opacity': '1'
    }], this.timingFromConfig(config));
    return this._effect;
  }
}); /// BareSpecifier=@polymer\neon-animation\animations\fade-out-animation

Polymer({
  is: 'fade-out-animation',
  behaviors: [NeonAnimationBehavior],
  configure: function (config) {
    var node = config.node;
    this._effect = new KeyframeEffect(node, [{
      'opacity': '1'
    }, {
      'opacity': '0'
    }], this.timingFromConfig(config));
    return this._effect;
  }
}); /// BareSpecifier=@polymer\paper-behaviors\paper-checked-element-behavior

const PaperCheckedElementBehaviorImpl = {
  /**
   * Synchronizes the element's checked state with its ripple effect.
   */_checkedChanged: function () {
    IronCheckedElementBehaviorImpl._checkedChanged.call(this);

    if (this.hasRipple()) {
      if (this.checked) {
        this._ripple.setAttribute('checked', '');
      } else {
        this._ripple.removeAttribute('checked');
      }
    }
  },
  /**
   * Synchronizes the element's `active` and `checked` state.
   */_buttonStateChanged: function () {
    PaperRippleBehavior._buttonStateChanged.call(this);

    if (this.disabled) {
      return;
    }

    if (this.isAttached) {
      this.checked = this.active;
    }
  }
}; /** @polymerBehavior */
const PaperCheckedElementBehavior = [PaperInkyFocusBehavior, IronCheckedElementBehavior, PaperCheckedElementBehaviorImpl];
var paperCheckedElementBehavior = {
  PaperCheckedElementBehaviorImpl: PaperCheckedElementBehaviorImpl,
  PaperCheckedElementBehavior: PaperCheckedElementBehavior
}; /// BareSpecifier=@polymer\paper-checkbox\paper-checkbox

const template$3 = html`<style>
  :host {
    display: inline-block;
    white-space: nowrap;
    cursor: pointer;
    --calculated-paper-checkbox-size: var(--paper-checkbox-size, 18px);
    /* -1px is a sentinel for the default and is replaced in \`attached\`. */
    --calculated-paper-checkbox-ink-size: var(--paper-checkbox-ink-size, -1px);
    @apply --paper-font-common-base;
    line-height: 0;
    -webkit-tap-highlight-color: transparent;
  }

  :host([hidden]) {
    display: none !important;
  }

  :host(:focus) {
    outline: none;
  }

  .hidden {
    display: none;
  }

  #checkboxContainer {
    display: inline-block;
    position: relative;
    width: var(--calculated-paper-checkbox-size);
    height: var(--calculated-paper-checkbox-size);
    min-width: var(--calculated-paper-checkbox-size);
    margin: var(--paper-checkbox-margin, initial);
    vertical-align: var(--paper-checkbox-vertical-align, middle);
    background-color: var(--paper-checkbox-unchecked-background-color, transparent);
  }

  #ink {
    position: absolute;

    /* Center the ripple in the checkbox by negative offsetting it by
     * (inkWidth - rippleWidth) / 2 */
    top: calc(0px - (var(--calculated-paper-checkbox-ink-size) - var(--calculated-paper-checkbox-size)) / 2);
    left: calc(0px - (var(--calculated-paper-checkbox-ink-size) - var(--calculated-paper-checkbox-size)) / 2);
    width: var(--calculated-paper-checkbox-ink-size);
    height: var(--calculated-paper-checkbox-ink-size);
    color: var(--paper-checkbox-unchecked-ink-color, var(--primary-text-color));
    opacity: 0.6;
    pointer-events: none;
  }

  #ink:dir(rtl) {
    right: calc(0px - (var(--calculated-paper-checkbox-ink-size) - var(--calculated-paper-checkbox-size)) / 2);
    left: auto;
  }

  #ink[checked] {
    color: var(--paper-checkbox-checked-ink-color, var(--primary-color));
  }

  #checkbox {
    position: relative;
    box-sizing: border-box;
    height: 100%;
    border: solid 2px;
    border-color: var(--paper-checkbox-unchecked-color, var(--primary-text-color));
    border-radius: 2px;
    pointer-events: none;
    -webkit-transition: background-color 140ms, border-color 140ms;
    transition: background-color 140ms, border-color 140ms;

    -webkit-transition-duration: var(--paper-checkbox-animation-duration, 140ms);
    transition-duration: var(--paper-checkbox-animation-duration, 140ms);
  }

  /* checkbox checked animations */
  #checkbox.checked #checkmark {
    -webkit-animation: checkmark-expand 140ms ease-out forwards;
    animation: checkmark-expand 140ms ease-out forwards;

    -webkit-animation-duration: var(--paper-checkbox-animation-duration, 140ms);
    animation-duration: var(--paper-checkbox-animation-duration, 140ms);
  }

  @-webkit-keyframes checkmark-expand {
    0% {
      -webkit-transform: scale(0, 0) rotate(45deg);
    }
    100% {
      -webkit-transform: scale(1, 1) rotate(45deg);
    }
  }

  @keyframes checkmark-expand {
    0% {
      transform: scale(0, 0) rotate(45deg);
    }
    100% {
      transform: scale(1, 1) rotate(45deg);
    }
  }

  #checkbox.checked {
    background-color: var(--paper-checkbox-checked-color, var(--primary-color));
    border-color: var(--paper-checkbox-checked-color, var(--primary-color));
  }

  #checkmark {
    position: absolute;
    width: 36%;
    height: 70%;
    border-style: solid;
    border-top: none;
    border-left: none;
    border-right-width: calc(2/15 * var(--calculated-paper-checkbox-size));
    border-bottom-width: calc(2/15 * var(--calculated-paper-checkbox-size));
    border-color: var(--paper-checkbox-checkmark-color, white);
    -webkit-transform-origin: 97% 86%;
    transform-origin: 97% 86%;
    box-sizing: content-box; /* protect against page-level box-sizing */
  }

  #checkmark:dir(rtl) {
    -webkit-transform-origin: 50% 14%;
    transform-origin: 50% 14%;
  }

  /* label */
  #checkboxLabel {
    position: relative;
    display: inline-block;
    vertical-align: middle;
    padding-left: var(--paper-checkbox-label-spacing, 8px);
    white-space: normal;
    line-height: normal;
    color: var(--paper-checkbox-label-color, var(--primary-text-color));
    @apply --paper-checkbox-label;
  }

  :host([checked]) #checkboxLabel {
    color: var(--paper-checkbox-label-checked-color, var(--paper-checkbox-label-color, var(--primary-text-color)));
    @apply --paper-checkbox-label-checked;
  }

  #checkboxLabel:dir(rtl) {
    padding-right: var(--paper-checkbox-label-spacing, 8px);
    padding-left: 0;
  }

  #checkboxLabel[hidden] {
    display: none;
  }

  /* disabled state */

  :host([disabled]) #checkbox {
    opacity: 0.5;
    border-color: var(--paper-checkbox-unchecked-color, var(--primary-text-color));
  }

  :host([disabled][checked]) #checkbox {
    background-color: var(--paper-checkbox-unchecked-color, var(--primary-text-color));
    opacity: 0.5;
  }

  :host([disabled]) #checkboxLabel  {
    opacity: 0.65;
  }

  /* invalid state */
  #checkbox.invalid:not(.checked) {
    border-color: var(--paper-checkbox-error-color, var(--error-color));
  }
</style>

<div id="checkboxContainer">
  <div id="checkbox" class$="[[_computeCheckboxClass(checked, invalid)]]">
    <div id="checkmark" class$="[[_computeCheckmarkClass(checked)]]"></div>
  </div>
</div>

<div id="checkboxLabel"><slot></slot></div>`;
template$3.setAttribute('strip-whitespace', ''); /**
                                                 Material design:
                                                 [Checkbox](https://www.google.com/design/spec/components/selection-controls.html#selection-controls-checkbox)
                                                                                               `paper-checkbox` is a button that can be either checked or unchecked. User can
                                                 tap the checkbox to check or uncheck it. Usually you use checkboxes to allow
                                                 user to select multiple options from a set. If you have a single ON/OFF option,
                                                 avoid using a single checkbox and use `paper-toggle-button` instead.
                                                                                               Example:
                                                                                                   <paper-checkbox>label</paper-checkbox>
                                                                                                   <paper-checkbox checked> label</paper-checkbox>
                                                                                               ### Styling
                                                                                               The following custom properties and mixins are available for styling:
                                                                                               Custom property | Description | Default
                                                 ----------------|-------------|----------
                                                 `--paper-checkbox-unchecked-background-color` | Checkbox background color when the input is not checked | `transparent`
                                                 `--paper-checkbox-unchecked-color` | Checkbox border color when the input is not checked | `--primary-text-color`
                                                 `--paper-checkbox-unchecked-ink-color` | Selected/focus ripple color when the input is not checked | `--primary-text-color`
                                                 `--paper-checkbox-checked-color` | Checkbox color when the input is checked | `--primary-color`
                                                 `--paper-checkbox-checked-ink-color` | Selected/focus ripple color when the input is checked | `--primary-color`
                                                 `--paper-checkbox-checkmark-color` | Checkmark color | `white`
                                                 `--paper-checkbox-label-color` | Label color | `--primary-text-color`
                                                 `--paper-checkbox-label-checked-color` | Label color when the input is checked | `--paper-checkbox-label-color`
                                                 `--paper-checkbox-label-spacing` | Spacing between the label and the checkbox | `8px`
                                                 `--paper-checkbox-label` | Mixin applied to the label | `{}`
                                                 `--paper-checkbox-label-checked` | Mixin applied to the label when the input is checked | `{}`
                                                 `--paper-checkbox-error-color` | Checkbox color when invalid | `--error-color`
                                                 `--paper-checkbox-size` | Size of the checkbox | `18px`
                                                 `--paper-checkbox-ink-size` | Size of the ripple | `48px`
                                                 `--paper-checkbox-margin` | Margin around the checkbox container | `initial`
                                                 `--paper-checkbox-vertical-align` | Vertical alignment of the checkbox container | `middle`
                                                                                               This element applies the mixin `--paper-font-common-base` but does not import
                                                 `paper-styles/typography.html`. In order to apply the `Roboto` font to this
                                                 element, make sure you've imported `paper-styles/typography.html`.
                                                                                               @demo demo/index.html
                                                 */
Polymer({
  _template: template$3,
  is: 'paper-checkbox',
  behaviors: [PaperCheckedElementBehavior],
  /** @private */hostAttributes: {
    role: 'checkbox',
    'aria-checked': false,
    tabindex: 0
  },
  properties: {
    /**
     * Fired when the checked state changes due to user interaction.
     *
     * @event change
     */ /**
         * Fired when the checked state changes.
         *
         * @event iron-change
         */ariaActiveAttribute: {
      type: String,
      value: 'aria-checked'
    }
  },
  attached: function () {
    // Wait until styles have resolved to check for the default sentinel.
    // See polymer#4009 for more details.
    afterNextRender(this, function () {
      var inkSize = this.getComputedStyleValue('--calculated-paper-checkbox-ink-size').trim(); // If unset, compute and set the default `--paper-checkbox-ink-size`.

      if (inkSize === '-1px') {
        var checkboxSizeText = this.getComputedStyleValue('--calculated-paper-checkbox-size').trim();
        var units = 'px';
        var unitsMatches = checkboxSizeText.match(/[A-Za-z]+$/);

        if (unitsMatches !== null) {
          units = unitsMatches[0];
        }

        var checkboxSize = parseFloat(checkboxSizeText);
        var defaultInkSize = 8 / 3 * checkboxSize;

        if (units === 'px') {
          defaultInkSize = Math.floor(defaultInkSize); // The checkbox and ripple need to have the same parity so that their
          // centers align.

          if (defaultInkSize % 2 !== checkboxSize % 2) {
            defaultInkSize++;
          }
        }

        this.updateStyles({
          '--paper-checkbox-ink-size': defaultInkSize + units
        });
      }
    });
  },
  _computeCheckboxClass: function (checked, invalid) {
    var className = '';

    if (checked) {
      className += 'checked ';
    }

    if (invalid) {
      className += 'invalid';
    }

    return className;
  },
  _computeCheckmarkClass: function (checked) {
    return checked ? '' : 'hidden';
  },
  // create ripple inside the checkboxContainer
  _createRipple: function () {
    this._rippleContainer = this.$.checkboxContainer;
    return PaperInkyFocusBehaviorImpl._createRipple.call(this);
  }
}); /// BareSpecifier=@polymer\paper-dialog-behavior\paper-dialog-behavior

const PaperDialogBehaviorImpl = {
  hostAttributes: {
    'role': 'dialog',
    'tabindex': '-1'
  },
  properties: {
    /**
     * If `modal` is true, this implies `no-cancel-on-outside-click`,
     * `no-cancel-on-esc-key` and `with-backdrop`.
     */modal: {
      type: Boolean,
      value: false
    },
    __readied: {
      type: Boolean,
      value: false
    }
  },
  observers: ['_modalChanged(modal, __readied)'],
  listeners: {
    'tap': '_onDialogClick'
  },
  /**
   * @return {void}
   */ready: function () {
    // Only now these properties can be read.
    this.__prevNoCancelOnOutsideClick = this.noCancelOnOutsideClick;
    this.__prevNoCancelOnEscKey = this.noCancelOnEscKey;
    this.__prevWithBackdrop = this.withBackdrop;
    this.__readied = true;
  },
  _modalChanged: function (modal, readied) {
    // modal implies noCancelOnOutsideClick, noCancelOnEscKey and withBackdrop.
    // We need to wait for the element to be ready before we can read the
    // properties values.
    if (!readied) {
      return;
    }

    if (modal) {
      this.__prevNoCancelOnOutsideClick = this.noCancelOnOutsideClick;
      this.__prevNoCancelOnEscKey = this.noCancelOnEscKey;
      this.__prevWithBackdrop = this.withBackdrop;
      this.noCancelOnOutsideClick = true;
      this.noCancelOnEscKey = true;
      this.withBackdrop = true;
    } else {
      // If the value was changed to false, let it false.
      this.noCancelOnOutsideClick = this.noCancelOnOutsideClick && this.__prevNoCancelOnOutsideClick;
      this.noCancelOnEscKey = this.noCancelOnEscKey && this.__prevNoCancelOnEscKey;
      this.withBackdrop = this.withBackdrop && this.__prevWithBackdrop;
    }
  },
  _updateClosingReasonConfirmed: function (confirmed) {
    this.closingReason = this.closingReason || {};
    this.closingReason.confirmed = confirmed;
  },
  /**
   * Will dismiss the dialog if user clicked on an element with dialog-dismiss
   * or dialog-confirm attribute.
   */_onDialogClick: function (event) {
    // Search for the element with dialog-confirm or dialog-dismiss,
    // from the root target until this (excluded).
    var path = dom(event).path;

    for (var i = 0, l = path.indexOf(this); i < l; i++) {
      var target = path[i];

      if (target.hasAttribute && (target.hasAttribute('dialog-dismiss') || target.hasAttribute('dialog-confirm'))) {
        this._updateClosingReasonConfirmed(target.hasAttribute('dialog-confirm'));

        this.close();
        event.stopPropagation();
        break;
      }
    }
  }
}; /** @polymerBehavior */
const PaperDialogBehavior = [IronOverlayBehavior, PaperDialogBehaviorImpl];
var paperDialogBehavior = {
  PaperDialogBehaviorImpl: PaperDialogBehaviorImpl,
  PaperDialogBehavior: PaperDialogBehavior
}; /// BareSpecifier=@polymer\paper-styles\typography

const template$4 = html`<custom-style>
  <style is="custom-style">
    html {

      /* Shared Styles */
      --paper-font-common-base: {
        font-family: 'Roboto', 'Noto', sans-serif;
        -webkit-font-smoothing: antialiased;
      };

      --paper-font-common-code: {
        font-family: 'Roboto Mono', 'Consolas', 'Menlo', monospace;
        -webkit-font-smoothing: antialiased;
      };

      --paper-font-common-expensive-kerning: {
        text-rendering: optimizeLegibility;
      };

      --paper-font-common-nowrap: {
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      };

      /* Material Font Styles */

      --paper-font-display4: {
        @apply --paper-font-common-base;
        @apply --paper-font-common-nowrap;

        font-size: 112px;
        font-weight: 300;
        letter-spacing: -.044em;
        line-height: 120px;
      };

      --paper-font-display3: {
        @apply --paper-font-common-base;
        @apply --paper-font-common-nowrap;

        font-size: 56px;
        font-weight: 400;
        letter-spacing: -.026em;
        line-height: 60px;
      };

      --paper-font-display2: {
        @apply --paper-font-common-base;

        font-size: 45px;
        font-weight: 400;
        letter-spacing: -.018em;
        line-height: 48px;
      };

      --paper-font-display1: {
        @apply --paper-font-common-base;

        font-size: 34px;
        font-weight: 400;
        letter-spacing: -.01em;
        line-height: 40px;
      };

      --paper-font-headline: {
        @apply --paper-font-common-base;

        font-size: 24px;
        font-weight: 400;
        letter-spacing: -.012em;
        line-height: 32px;
      };

      --paper-font-title: {
        @apply --paper-font-common-base;
        @apply --paper-font-common-nowrap;

        font-size: 20px;
        font-weight: 500;
        line-height: 28px;
      };

      --paper-font-subhead: {
        @apply --paper-font-common-base;

        font-size: 16px;
        font-weight: 400;
        line-height: 24px;
      };

      --paper-font-body2: {
        @apply --paper-font-common-base;

        font-size: 14px;
        font-weight: 500;
        line-height: 24px;
      };

      --paper-font-body1: {
        @apply --paper-font-common-base;

        font-size: 14px;
        font-weight: 400;
        line-height: 20px;
      };

      --paper-font-caption: {
        @apply --paper-font-common-base;
        @apply --paper-font-common-nowrap;

        font-size: 12px;
        font-weight: 400;
        letter-spacing: 0.011em;
        line-height: 20px;
      };

      --paper-font-menu: {
        @apply --paper-font-common-base;
        @apply --paper-font-common-nowrap;

        font-size: 13px;
        font-weight: 500;
        line-height: 24px;
      };

      --paper-font-button: {
        @apply --paper-font-common-base;
        @apply --paper-font-common-nowrap;

        font-size: 14px;
        font-weight: 500;
        letter-spacing: 0.018em;
        line-height: 24px;
        text-transform: uppercase;
      };

      --paper-font-code2: {
        @apply --paper-font-common-code;

        font-size: 14px;
        font-weight: 700;
        line-height: 20px;
      };

      --paper-font-code1: {
        @apply --paper-font-common-code;

        font-size: 14px;
        font-weight: 500;
        line-height: 20px;
      };

    }

  </style>
</custom-style>`;
template$4.setAttribute('style', 'display: none;');
document.head.appendChild(template$4.content); /// BareSpecifier=@polymer\paper-dialog-behavior\paper-dialog-shared-styles

const $_documentContainer = document.createElement('template');
$_documentContainer.setAttribute('style', 'display: none;');
$_documentContainer.innerHTML = `<dom-module id="paper-dialog-shared-styles">
  <template>
    <style>
      :host {
        display: block;
        margin: 24px 40px;

        background: var(--paper-dialog-background-color, var(--primary-background-color));
        color: var(--paper-dialog-color, var(--primary-text-color));

        @apply --paper-font-body1;
        @apply --shadow-elevation-16dp;
        @apply --paper-dialog;
      }

      :host > ::slotted(*) {
        margin-top: 20px;
        padding: 0 24px;
      }

      :host > ::slotted(.no-padding) {
        padding: 0;
      }

      
      :host > ::slotted(*:first-child) {
        margin-top: 24px;
      }

      :host > ::slotted(*:last-child) {
        margin-bottom: 24px;
      }

      /* In 1.x, this selector was \`:host > ::content h2\`. In 2.x <slot> allows
      to select direct children only, which increases the weight of this
      selector, so we have to re-define first-child/last-child margins below. */
      :host > ::slotted(h2) {
        position: relative;
        margin: 0;

        @apply --paper-font-title;
        @apply --paper-dialog-title;
      }

      /* Apply mixin again, in case it sets margin-top. */
      :host > ::slotted(h2:first-child) {
        margin-top: 24px;
        @apply --paper-dialog-title;
      }

      /* Apply mixin again, in case it sets margin-bottom. */
      :host > ::slotted(h2:last-child) {
        margin-bottom: 24px;
        @apply --paper-dialog-title;
      }

      :host > ::slotted(.paper-dialog-buttons),
      :host > ::slotted(.buttons) {
        position: relative;
        padding: 8px 8px 8px 24px;
        margin: 0;

        color: var(--paper-dialog-button-color, var(--primary-color));

        @apply --layout-horizontal;
        @apply --layout-end-justified;
      }
    </style>
  </template>
</dom-module>`;
document.head.appendChild($_documentContainer.content); /// BareSpecifier=@polymer\paper-dialog-scrollable\paper-dialog-scrollable

Polymer({
  _template: html`
    <style>

      :host {
        display: block;
        @apply --layout-relative;
      }

      :host(.is-scrolled:not(:first-child))::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 1px;
        background: var(--divider-color);
      }

      :host(.can-scroll:not(.scrolled-to-bottom):not(:last-child))::after {
        content: '';
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        height: 1px;
        background: var(--divider-color);
      }

      .scrollable {
        padding: 0 24px;

        @apply --layout-scroll;
        @apply --paper-dialog-scrollable;
      }

      .fit {
        @apply --layout-fit;
      }
    </style>

    <div id="scrollable" class="scrollable" on-scroll="updateScrollState">
      <slot></slot>
    </div>
`,
  is: 'paper-dialog-scrollable',
  properties: {
    /**
     * The dialog element that implements `Polymer.PaperDialogBehavior`
     * containing this element.
     * @type {?Node}
     */dialogElement: {
      type: Object
    }
  },

  /**
   * Returns the scrolling element.
   */get scrollTarget() {
    return this.$.scrollable;
  },

  ready: function () {
    this._ensureTarget();

    this.classList.add('no-padding');
  },
  attached: function () {
    this._ensureTarget();

    requestAnimationFrame(this.updateScrollState.bind(this));
  },
  updateScrollState: function () {
    this.toggleClass('is-scrolled', this.scrollTarget.scrollTop > 0);
    this.toggleClass('can-scroll', this.scrollTarget.offsetHeight < this.scrollTarget.scrollHeight);
    this.toggleClass('scrolled-to-bottom', this.scrollTarget.scrollTop + this.scrollTarget.offsetHeight >= this.scrollTarget.scrollHeight);
  },
  _ensureTarget: function () {
    // Read parentElement instead of parentNode in order to skip shadowRoots.
    this.dialogElement = this.dialogElement || this.parentElement; // Check if dialog implements paper-dialog-behavior. If not, fit
    // scrollTarget to host.

    if (this.dialogElement && this.dialogElement.behaviors && this.dialogElement.behaviors.indexOf(PaperDialogBehaviorImpl) >= 0) {
      this.dialogElement.sizingTarget = this.scrollTarget;
      this.scrollTarget.classList.remove('fit');
    } else if (this.dialogElement) {
      this.scrollTarget.classList.add('fit');
    }
  }
}); /// BareSpecifier=@polymer\paper-dialog\paper-dialog

Polymer({
  _template: html`
    <style include="paper-dialog-shared-styles"></style>
    <slot></slot>
`,
  is: 'paper-dialog',
  behaviors: [PaperDialogBehavior, NeonAnimationRunnerBehavior],
  listeners: {
    'neon-animation-finish': '_onNeonAnimationFinish'
  },
  _renderOpened: function () {
    this.cancelAnimation();
    this.playAnimation('entry');
  },
  _renderClosed: function () {
    this.cancelAnimation();
    this.playAnimation('exit');
  },
  _onNeonAnimationFinish: function () {
    if (this.opened) {
      this._finishRenderOpened();
    } else {
      this._finishRenderClosed();
    }
  }
}); /// BareSpecifier=@polymer\paper-dropdown-menu\paper-dropdown-menu-icons

const $_documentContainer$1 = document.createElement('template');
$_documentContainer$1.setAttribute('style', 'display: none;');
$_documentContainer$1.innerHTML = `<iron-iconset-svg name="paper-dropdown-menu" size="24">
<svg><defs>
<g id="arrow-drop-down"><path d="M7 10l5 5 5-5z"></path></g>
</defs></svg>
</iron-iconset-svg>`;
document.head.appendChild($_documentContainer$1.content); /// BareSpecifier=@polymer\paper-dropdown-menu\paper-dropdown-menu-shared-styles

const $_documentContainer$2 = document.createElement('template');
$_documentContainer$2.setAttribute('style', 'display: none;');
$_documentContainer$2.innerHTML = `<dom-module id="paper-dropdown-menu-shared-styles">
  <template>
    <style>
      :host {
        display: inline-block;
        position: relative;
        text-align: left;

        /* NOTE(cdata): Both values are needed, since some phones require the
         * value to be \`transparent\`.
         */
        -webkit-tap-highlight-color: rgba(0,0,0,0);
        -webkit-tap-highlight-color: transparent;

        --paper-input-container-input: {
          overflow: hidden;
          white-space: nowrap;
          text-overflow: ellipsis;
          max-width: 100%;
          box-sizing: border-box;
          cursor: pointer;
        };

        @apply --paper-dropdown-menu;
      }

      :host([disabled]) {
        @apply --paper-dropdown-menu-disabled;
      }

      :host([noink]) paper-ripple {
        display: none;
      }

      :host([no-label-float]) paper-ripple {
        top: 8px;
      }

      paper-ripple {
        top: 12px;
        left: 0px;
        bottom: 8px;
        right: 0px;

        @apply --paper-dropdown-menu-ripple;
      }

      paper-menu-button {
        display: block;
        padding: 0;

        @apply --paper-dropdown-menu-button;
      }

      paper-input {
        @apply --paper-dropdown-menu-input;
      }

      iron-icon {
        color: var(--disabled-text-color);

        @apply --paper-dropdown-menu-icon;
      }
    </style>
  </template>
</dom-module>`;
document.head.appendChild($_documentContainer$2.content); /// BareSpecifier=@polymer\paper-input\paper-input-addon-behavior

const PaperInputAddonBehavior = {
  attached: function () {
    this.fire('addon-attached');
  },
  /**
   * The function called by `<paper-input-container>` when the input value or
   * validity changes.
   * @param {{
   *   invalid: boolean,
   *   inputElement: (Element|undefined),
   *   value: (string|undefined)
   * }} state -
   *     inputElement: The input element.
   *     value: The input value.
   *     invalid: True if the input value is invalid.
   */update: function (state) {}
};
var paperInputAddonBehavior = {
  PaperInputAddonBehavior: PaperInputAddonBehavior
}; /// BareSpecifier=@polymer\paper-input\paper-input-char-counter

Polymer({
  _template: html`
    <style>
      :host {
        display: inline-block;
        float: right;

        @apply --paper-font-caption;
        @apply --paper-input-char-counter;
      }

      :host([hidden]) {
        display: none !important;
      }

      :host(:dir(rtl)) {
        float: left;
      }
    </style>

    <span>[[_charCounterStr]]</span>
`,
  is: 'paper-input-char-counter',
  behaviors: [PaperInputAddonBehavior],
  properties: {
    _charCounterStr: {
      type: String,
      value: '0'
    }
  },
  /**
   * This overrides the update function in PaperInputAddonBehavior.
   * @param {{
   *   inputElement: (Element|undefined),
   *   value: (string|undefined),
   *   invalid: boolean
   * }} state -
   *     inputElement: The input element.
   *     value: The input value.
   *     invalid: True if the input value is invalid.
   */update: function (state) {
    if (!state.inputElement) {
      return;
    }

    state.value = state.value || '';
    var counter = state.value.toString().length.toString();

    if (state.inputElement.hasAttribute('maxlength')) {
      counter += '/' + state.inputElement.getAttribute('maxlength');
    }

    this._charCounterStr = counter;
  }
}); /// BareSpecifier=@polymer\paper-input\paper-input-container

const template$5 = html`
<custom-style>
  <style is="custom-style">
    html {
      --paper-input-container-shared-input-style: {
        position: relative; /* to make a stacking context */
        outline: none;
        box-shadow: none;
        padding: 0;
        margin: 0;
        width: 100%;
        max-width: 100%;
        background: transparent;
        border: none;
        color: var(--paper-input-container-input-color, var(--primary-text-color));
        -webkit-appearance: none;
        text-align: inherit;
        vertical-align: var(--paper-input-container-input-align, bottom);

        @apply --paper-font-subhead;
      };
    }
  </style>
</custom-style>
`;
template$5.setAttribute('style', 'display: none;');
document.head.appendChild(template$5.content); /*
                                               `<paper-input-container>` is a container for a `<label>`, an `<iron-input>` or
                                               `<textarea>` and optional add-on elements such as an error message or character
                                               counter, used to implement Material Design text fields.
                                                                                           For example:
                                                                                               <paper-input-container>
                                                   <label slot="label">Your name</label>
                                                   <iron-input slot="input">
                                                     <input>
                                                   </iron-input>
                                                   // In Polymer 1.0, you would use `<input is="iron-input" slot="input">`
                                               instead of the above.
                                                 </paper-input-container>
                                                                                           You can style the nested `<input>` however you want; if you want it to look like
                                               a Material Design input, you can style it with the
                                               --paper-input-container-shared-input-style mixin.
                                                                                           Do not wrap `<paper-input-container>` around elements that already include it,
                                               such as `<paper-input>`. Doing so may cause events to bounce infinitely between
                                               the container and its contained element.
                                                                                           ### Listening for input changes
                                                                                           By default, it listens for changes on the `bind-value` attribute on its children
                                               nodes and perform tasks such as auto-validating and label styling when the
                                               `bind-value` changes. You can configure the attribute it listens to with the
                                               `attr-for-value` attribute.
                                                                                           ### Using a custom input element
                                                                                           You can use a custom input element in a `<paper-input-container>`, for example
                                               to implement a compound input field like a social security number input. The
                                               custom input element should have the `paper-input-input` class, have a
                                               `notify:true` value property and optionally implements
                                               `Polymer.IronValidatableBehavior` if it is validatable.
                                                                                               <paper-input-container attr-for-value="ssn-value">
                                                   <label slot="label">Social security number</label>
                                                   <ssn-input slot="input" class="paper-input-input"></ssn-input>
                                                 </paper-input-container>
                                                                                           
                                               If you're using a `<paper-input-container>` imperatively, it's important to make
                                               sure that you attach its children (the `iron-input` and the optional `label`)
                                               before you attach the `<paper-input-container>` itself, so that it can be set up
                                               correctly.
                                                                                           ### Validation
                                                                                           If the `auto-validate` attribute is set, the input container will validate the
                                               input and update the container styling when the input value changes.
                                                                                           ### Add-ons
                                                                                           Add-ons are child elements of a `<paper-input-container>` with the `add-on`
                                               attribute and implements the `Polymer.PaperInputAddonBehavior` behavior. They
                                               are notified when the input value or validity changes, and may implement
                                               functionality such as error messages or character counters. They appear at the
                                               bottom of the input.
                                                                                           ### Prefixes and suffixes
                                               These are child elements of a `<paper-input-container>` with the `prefix`
                                               or `suffix` attribute, and are displayed inline with the input, before or after.
                                                                                               <paper-input-container>
                                                   <div slot="prefix">$</div>
                                                   <label slot="label">Total</label>
                                                   <iron-input slot="input">
                                                     <input>
                                                   </iron-input>
                                                   // In Polymer 1.0, you would use `<input is="iron-input" slot="input">`
                                               instead of the above. <paper-icon-button slot="suffix"
                                               icon="clear"></paper-icon-button>
                                                 </paper-input-container>
                                                                                           ### Styling
                                                                                           The following custom properties and mixins are available for styling:
                                                                                           Custom property | Description | Default
                                               ----------------|-------------|----------
                                               `--paper-input-container-color` | Label and underline color when the input is not focused | `--secondary-text-color`
                                               `--paper-input-container-focus-color` | Label and underline color when the input is focused | `--primary-color`
                                               `--paper-input-container-invalid-color` | Label and underline color when the input is is invalid | `--error-color`
                                               `--paper-input-container-input-color` | Input foreground color | `--primary-text-color`
                                               `--paper-input-container` | Mixin applied to the container | `{}`
                                               `--paper-input-container-disabled` | Mixin applied to the container when it's disabled | `{}`
                                               `--paper-input-container-label` | Mixin applied to the label | `{}`
                                               `--paper-input-container-label-focus` | Mixin applied to the label when the input is focused | `{}`
                                               `--paper-input-container-label-floating` | Mixin applied to the label when floating | `{}`
                                               `--paper-input-container-input` | Mixin applied to the input | `{}`
                                               `--paper-input-container-input-align` | The vertical-align property of the input | `bottom`
                                               `--paper-input-container-input-disabled` | Mixin applied to the input when the component is disabled | `{}`
                                               `--paper-input-container-input-focus` | Mixin applied to the input when focused | `{}`
                                               `--paper-input-container-input-invalid` | Mixin applied to the input when invalid | `{}`
                                               `--paper-input-container-input-webkit-spinner` | Mixin applied to the webkit spinner | `{}`
                                               `--paper-input-container-input-webkit-clear` | Mixin applied to the webkit clear button | `{}`
                                               `--paper-input-container-input-webkit-calendar-picker-indicator` | Mixin applied to the webkit calendar picker indicator | `{}`
                                               `--paper-input-container-ms-clear` | Mixin applied to the Internet Explorer clear button | `{}`
                                               `--paper-input-container-underline` | Mixin applied to the underline | `{}`
                                               `--paper-input-container-underline-focus` | Mixin applied to the underline when the input is focused | `{}`
                                               `--paper-input-container-underline-disabled` | Mixin applied to the underline when the input is disabled | `{}`
                                               `--paper-input-prefix` | Mixin applied to the input prefix | `{}`
                                               `--paper-input-suffix` | Mixin applied to the input suffix | `{}`
                                                                                           This element is `display:block` by default, but you can set the `inline`
                                               attribute to make it `display:inline-block`.
                                               */
Polymer({
  _template: html`
    <style>
      :host {
        display: block;
        padding: 8px 0;
        @apply --paper-input-container;
      }

      :host([inline]) {
        display: inline-block;
      }

      :host([disabled]) {
        pointer-events: none;
        opacity: 0.33;

        @apply --paper-input-container-disabled;
      }

      :host([hidden]) {
        display: none !important;
      }

      [hidden] {
        display: none !important;
      }

      .floated-label-placeholder {
        @apply --paper-font-caption;
      }

      .underline {
        height: 2px;
        position: relative;
      }

      .focused-line {
        @apply --layout-fit;
        border-bottom: 2px solid var(--paper-input-container-focus-color, var(--primary-color));

        -webkit-transform-origin: center center;
        transform-origin: center center;
        -webkit-transform: scale3d(0,1,1);
        transform: scale3d(0,1,1);

        @apply --paper-input-container-underline-focus;
      }

      .underline.is-highlighted .focused-line {
        -webkit-transform: none;
        transform: none;
        -webkit-transition: -webkit-transform 0.25s;
        transition: transform 0.25s;

        @apply --paper-transition-easing;
      }

      .underline.is-invalid .focused-line {
        border-color: var(--paper-input-container-invalid-color, var(--error-color));
        -webkit-transform: none;
        transform: none;
        -webkit-transition: -webkit-transform 0.25s;
        transition: transform 0.25s;

        @apply --paper-transition-easing;
      }

      .unfocused-line {
        @apply --layout-fit;
        border-bottom: 1px solid var(--paper-input-container-color, var(--secondary-text-color));
        @apply --paper-input-container-underline;
      }

      :host([disabled]) .unfocused-line {
        border-bottom: 1px dashed;
        border-color: var(--paper-input-container-color, var(--secondary-text-color));
        @apply --paper-input-container-underline-disabled;
      }

      .input-wrapper {
        @apply --layout-horizontal;
        @apply --layout-center;
        position: relative;
      }

      .input-content {
        @apply --layout-flex-auto;
        @apply --layout-relative;
        max-width: 100%;
      }

      .input-content ::slotted(label),
      .input-content ::slotted(.paper-input-label) {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        font: inherit;
        color: var(--paper-input-container-color, var(--secondary-text-color));
        -webkit-transition: -webkit-transform 0.25s, width 0.25s;
        transition: transform 0.25s, width 0.25s;
        -webkit-transform-origin: left top;
        transform-origin: left top;
        /* Fix for safari not focusing 0-height date/time inputs with -webkit-apperance: none; */
        min-height: 1px;

        @apply --paper-font-common-nowrap;
        @apply --paper-font-subhead;
        @apply --paper-input-container-label;
        @apply --paper-transition-easing;
      }

      .input-content.label-is-floating ::slotted(label),
      .input-content.label-is-floating ::slotted(.paper-input-label) {
        -webkit-transform: translateY(-75%) scale(0.75);
        transform: translateY(-75%) scale(0.75);

        /* Since we scale to 75/100 of the size, we actually have 100/75 of the
        original space now available */
        width: 133%;

        @apply --paper-input-container-label-floating;
      }

      :host(:dir(rtl)) .input-content.label-is-floating ::slotted(label),
      :host(:dir(rtl)) .input-content.label-is-floating ::slotted(.paper-input-label) {
        right: 0;
        left: auto;
        -webkit-transform-origin: right top;
        transform-origin: right top;
      }

      .input-content.label-is-highlighted ::slotted(label),
      .input-content.label-is-highlighted ::slotted(.paper-input-label) {
        color: var(--paper-input-container-focus-color, var(--primary-color));

        @apply --paper-input-container-label-focus;
      }

      .input-content.is-invalid ::slotted(label),
      .input-content.is-invalid ::slotted(.paper-input-label) {
        color: var(--paper-input-container-invalid-color, var(--error-color));
      }

      .input-content.label-is-hidden ::slotted(label),
      .input-content.label-is-hidden ::slotted(.paper-input-label) {
        visibility: hidden;
      }

      .input-content ::slotted(input),
      .input-content ::slotted(iron-input),
      .input-content ::slotted(textarea),
      .input-content ::slotted(iron-autogrow-textarea),
      .input-content ::slotted(.paper-input-input) {
        @apply --paper-input-container-shared-input-style;
        /* The apply shim doesn't apply the nested color custom property,
          so we have to re-apply it here. */
        color: var(--paper-input-container-input-color, var(--primary-text-color));
        @apply --paper-input-container-input;
      }

      .input-content ::slotted(input)::-webkit-outer-spin-button,
      .input-content ::slotted(input)::-webkit-inner-spin-button {
        @apply --paper-input-container-input-webkit-spinner;
      }

      .input-content.focused ::slotted(input),
      .input-content.focused ::slotted(iron-input),
      .input-content.focused ::slotted(textarea),
      .input-content.focused ::slotted(iron-autogrow-textarea),
      .input-content.focused ::slotted(.paper-input-input) {
        @apply --paper-input-container-input-focus;
      }

      .input-content.is-invalid ::slotted(input),
      .input-content.is-invalid ::slotted(iron-input),
      .input-content.is-invalid ::slotted(textarea),
      .input-content.is-invalid ::slotted(iron-autogrow-textarea),
      .input-content.is-invalid ::slotted(.paper-input-input) {
        @apply --paper-input-container-input-invalid;
      }

      .prefix ::slotted(*) {
        display: inline-block;
        @apply --paper-font-subhead;
        @apply --layout-flex-none;
        @apply --paper-input-prefix;
      }

      .suffix ::slotted(*) {
        display: inline-block;
        @apply --paper-font-subhead;
        @apply --layout-flex-none;

        @apply --paper-input-suffix;
      }

      /* Firefox sets a min-width on the input, which can cause layout issues */
      .input-content ::slotted(input) {
        min-width: 0;
      }

      .input-content ::slotted(textarea) {
        resize: none;
      }

      .add-on-content {
        position: relative;
      }

      .add-on-content.is-invalid ::slotted(*) {
        color: var(--paper-input-container-invalid-color, var(--error-color));
      }

      .add-on-content.is-highlighted ::slotted(*) {
        color: var(--paper-input-container-focus-color, var(--primary-color));
      }
    </style>

    <div class="floated-label-placeholder" aria-hidden="true" hidden="[[noLabelFloat]]">&nbsp;</div>

    <div class="input-wrapper">
      <span class="prefix"><slot name="prefix"></slot></span>

      <div class\$="[[_computeInputContentClass(noLabelFloat,alwaysFloatLabel,focused,invalid,_inputHasContent)]]" id="labelAndInputContainer">
        <slot name="label"></slot>
        <slot name="input"></slot>
      </div>

      <span class="suffix"><slot name="suffix"></slot></span>
    </div>

    <div class\$="[[_computeUnderlineClass(focused,invalid)]]">
      <div class="unfocused-line"></div>
      <div class="focused-line"></div>
    </div>

    <div class\$="[[_computeAddOnContentClass(focused,invalid)]]">
      <slot name="add-on"></slot>
    </div>
`,
  is: 'paper-input-container',
  properties: {
    /**
     * Set to true to disable the floating label. The label disappears when the
     * input value is not null.
     */noLabelFloat: {
      type: Boolean,
      value: false
    },
    /**
     * Set to true to always float the floating label.
     */alwaysFloatLabel: {
      type: Boolean,
      value: false
    },
    /**
     * The attribute to listen for value changes on.
     */attrForValue: {
      type: String,
      value: 'bind-value'
    },
    /**
     * Set to true to auto-validate the input value when it changes.
     */autoValidate: {
      type: Boolean,
      value: false
    },
    /**
     * True if the input is invalid. This property is set automatically when the
     * input value changes if auto-validating, or when the `iron-input-validate`
     * event is heard from a child.
     */invalid: {
      observer: '_invalidChanged',
      type: Boolean,
      value: false
    },
    /**
     * True if the input has focus.
     */focused: {
      readOnly: true,
      type: Boolean,
      value: false,
      notify: true
    },
    _addons: {
      type: Array // do not set a default value here intentionally - it will be initialized
      // lazily when a distributed child is attached, which may occur before
      // configuration for this element in polyfill.

    },
    _inputHasContent: {
      type: Boolean,
      value: false
    },
    _inputSelector: {
      type: String,
      value: 'input,iron-input,textarea,.paper-input-input'
    },
    _boundOnFocus: {
      type: Function,
      value: function () {
        return this._onFocus.bind(this);
      }
    },
    _boundOnBlur: {
      type: Function,
      value: function () {
        return this._onBlur.bind(this);
      }
    },
    _boundOnInput: {
      type: Function,
      value: function () {
        return this._onInput.bind(this);
      }
    },
    _boundValueChanged: {
      type: Function,
      value: function () {
        return this._onValueChanged.bind(this);
      }
    }
  },
  listeners: {
    'addon-attached': '_onAddonAttached',
    'iron-input-validate': '_onIronInputValidate'
  },

  get _valueChangedEvent() {
    return this.attrForValue + '-changed';
  },

  get _propertyForValue() {
    return dashToCamelCase(this.attrForValue);
  },

  get _inputElement() {
    return dom(this).querySelector(this._inputSelector);
  },

  get _inputElementValue() {
    return this._inputElement[this._propertyForValue] || this._inputElement.value;
  },

  ready: function () {
    // Paper-input treats a value of undefined differently at startup than
    // the rest of the time (specifically: it does not validate it at startup,
    // but it does after that. We need to track whether the first time we
    // encounter the value is basically this first time, so that we can validate
    // it correctly the rest of the time. See
    // https://github.com/PolymerElements/paper-input/issues/605
    this.__isFirstValueUpdate = true;

    if (!this._addons) {
      this._addons = [];
    }

    this.addEventListener('focus', this._boundOnFocus, true);
    this.addEventListener('blur', this._boundOnBlur, true);
  },
  attached: function () {
    if (this.attrForValue) {
      this._inputElement.addEventListener(this._valueChangedEvent, this._boundValueChanged);
    } else {
      this.addEventListener('input', this._onInput);
    } // Only validate when attached if the input already has a value.


    if (this._inputElementValue && this._inputElementValue != '') {
      this._handleValueAndAutoValidate(this._inputElement);
    } else {
      this._handleValue(this._inputElement);
    }
  },
  /** @private */_onAddonAttached: function (event) {
    if (!this._addons) {
      this._addons = [];
    }

    var target = event.target;

    if (this._addons.indexOf(target) === -1) {
      this._addons.push(target);

      if (this.isAttached) {
        this._handleValue(this._inputElement);
      }
    }
  },
  /** @private */_onFocus: function () {
    this._setFocused(true);
  },
  /** @private */_onBlur: function () {
    this._setFocused(false);

    this._handleValueAndAutoValidate(this._inputElement);
  },
  /** @private */_onInput: function (event) {
    this._handleValueAndAutoValidate(event.target);
  },
  /** @private */_onValueChanged: function (event) {
    var input = event.target; // Paper-input treats a value of undefined differently at startup than
    // the rest of the time (specifically: it does not validate it at startup,
    // but it does after that. If this is in fact the bootup case, ignore
    // validation, just this once.

    if (this.__isFirstValueUpdate) {
      this.__isFirstValueUpdate = false;

      if (input.value === undefined || input.value === '') {
        return;
      }
    }

    this._handleValueAndAutoValidate(event.target);
  },
  /** @private */_handleValue: function (inputElement) {
    var value = this._inputElementValue; // type="number" hack needed because this.value is empty until it's valid

    if (value || value === 0 || inputElement.type === 'number' && !inputElement.checkValidity()) {
      this._inputHasContent = true;
    } else {
      this._inputHasContent = false;
    }

    this.updateAddons({
      inputElement: inputElement,
      value: value,
      invalid: this.invalid
    });
  },
  /** @private */_handleValueAndAutoValidate: function (inputElement) {
    if (this.autoValidate && inputElement) {
      var valid;

      if (inputElement.validate) {
        valid = inputElement.validate(this._inputElementValue);
      } else {
        valid = inputElement.checkValidity();
      }

      this.invalid = !valid;
    } // Call this last to notify the add-ons.


    this._handleValue(inputElement);
  },
  /** @private */_onIronInputValidate: function (event) {
    this.invalid = this._inputElement.invalid;
  },
  /** @private */_invalidChanged: function () {
    if (this._addons) {
      this.updateAddons({
        invalid: this.invalid
      });
    }
  },
  /**
   * Call this to update the state of add-ons.
   * @param {Object} state Add-on state.
   */updateAddons: function (state) {
    for (var addon, index = 0; addon = this._addons[index]; index++) {
      addon.update(state);
    }
  },
  /** @private */_computeInputContentClass: function (noLabelFloat, alwaysFloatLabel, focused, invalid, _inputHasContent) {
    var cls = 'input-content';

    if (!noLabelFloat) {
      var label = this.querySelector('label');

      if (alwaysFloatLabel || _inputHasContent) {
        cls += ' label-is-floating'; // If the label is floating, ignore any offsets that may have been
        // applied from a prefix element.

        this.$.labelAndInputContainer.style.position = 'static';

        if (invalid) {
          cls += ' is-invalid';
        } else if (focused) {
          cls += ' label-is-highlighted';
        }
      } else {
        // When the label is not floating, it should overlap the input element.
        if (label) {
          this.$.labelAndInputContainer.style.position = 'relative';
        }

        if (invalid) {
          cls += ' is-invalid';
        }
      }
    } else {
      if (_inputHasContent) {
        cls += ' label-is-hidden';
      }

      if (invalid) {
        cls += ' is-invalid';
      }
    }

    if (focused) {
      cls += ' focused';
    }

    return cls;
  },
  /** @private */_computeUnderlineClass: function (focused, invalid) {
    var cls = 'underline';

    if (invalid) {
      cls += ' is-invalid';
    } else if (focused) {
      cls += ' is-highlighted';
    }

    return cls;
  },
  /** @private */_computeAddOnContentClass: function (focused, invalid) {
    var cls = 'add-on-content';

    if (invalid) {
      cls += ' is-invalid';
    } else if (focused) {
      cls += ' is-highlighted';
    }

    return cls;
  }
}); /// BareSpecifier=@polymer\paper-input\paper-input-error

Polymer({
  _template: html`
    <style>
      :host {
        display: inline-block;
        visibility: hidden;

        color: var(--paper-input-container-invalid-color, var(--error-color));

        @apply --paper-font-caption;
        @apply --paper-input-error;
        position: absolute;
        left:0;
        right:0;
      }

      :host([invalid]) {
        visibility: visible;
      };
    </style>

    <slot></slot>
`,
  is: 'paper-input-error',
  behaviors: [PaperInputAddonBehavior],
  properties: {
    /**
     * True if the error is showing.
     */invalid: {
      readOnly: true,
      reflectToAttribute: true,
      type: Boolean
    }
  },
  /**
   * This overrides the update function in PaperInputAddonBehavior.
   * @param {{
   *   inputElement: (Element|undefined),
   *   value: (string|undefined),
   *   invalid: boolean
   * }} state -
   *     inputElement: The input element.
   *     value: The input value.
   *     invalid: True if the input value is invalid.
   */update: function (state) {
    this._setInvalid(state.invalid);
  }
}); /// BareSpecifier=@polymer\paper-input\paper-input-behavior
// aria-labelledby) and add-ons.

const PaperInputHelper = {};
PaperInputHelper.NextLabelID = 1;
PaperInputHelper.NextAddonID = 1;
PaperInputHelper.NextInputID = 1; /**
                                   * Use `PaperInputBehavior` to implement inputs with `<paper-input-container>`.
                                   * This behavior is implemented by `<paper-input>`. It exposes a number of
                                   * properties from `<paper-input-container>` and `<input is="iron-input">` and
                                   * they should be bound in your template.
                                   *
                                   * The input element can be accessed by the `inputElement` property if you need
                                   * to access properties or methods that are not exposed.
                                   * @polymerBehavior PaperInputBehavior
                                   */
const PaperInputBehaviorImpl = {
  properties: {
    /**
     * Fired when the input changes due to user interaction.
     *
     * @event change
     */ /**
         * The label for this input. If you're using PaperInputBehavior to
         * implement your own paper-input-like element, bind this to
         * `<label>`'s content and `hidden` property, e.g.
         * `<label hidden$="[[!label]]">[[label]]</label>` in your `template`
         */label: {
      type: String
    },
    /**
     * The value for this input. If you're using PaperInputBehavior to
     * implement your own paper-input-like element, bind this to
     * the `<iron-input>`'s `bindValue`
     * property, or the value property of your input that is `notify:true`.
     * @type {*}
     */value: {
      notify: true,
      type: String
    },
    /**
     * Set to true to disable this input. If you're using PaperInputBehavior to
     * implement your own paper-input-like element, bind this to
     * both the `<paper-input-container>`'s and the input's `disabled` property.
     */disabled: {
      type: Boolean,
      value: false
    },
    /**
     * Returns true if the value is invalid. If you're using PaperInputBehavior
     * to implement your own paper-input-like element, bind this to both the
     * `<paper-input-container>`'s and the input's `invalid` property.
     *
     * If `autoValidate` is true, the `invalid` attribute is managed
     * automatically, which can clobber attempts to manage it manually.
     */invalid: {
      type: Boolean,
      value: false,
      notify: true
    },
    /**
     * Set this to specify the pattern allowed by `preventInvalidInput`. If
     * you're using PaperInputBehavior to implement your own paper-input-like
     * element, bind this to the `<input is="iron-input">`'s `allowedPattern`
     * property.
     */allowedPattern: {
      type: String
    },
    /**
     * The type of the input. The supported types are the
     * [native input's
     * types](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input#Form_<input>_types).
     * If you're using PaperInputBehavior to implement your own paper-input-like
     * element, bind this to the (Polymer 1) `<input is="iron-input">`'s or
     * (Polymer 2)
     * `<iron-input>`'s `type` property.
     */type: {
      type: String
    },
    /**
     * The datalist of the input (if any). This should match the id of an
     * existing `<datalist>`. If you're using PaperInputBehavior to implement
     * your own paper-input-like element, bind this to the `<input
     * is="iron-input">`'s `list` property.
     */list: {
      type: String
    },
    /**
     * A pattern to validate the `input` with. If you're using
     * PaperInputBehavior to implement your own paper-input-like element, bind
     * this to the `<input is="iron-input">`'s `pattern` property.
     */pattern: {
      type: String
    },
    /**
     * Set to true to mark the input as required. If you're using
     * PaperInputBehavior to implement your own paper-input-like element, bind
     * this to the `<input is="iron-input">`'s `required` property.
     */required: {
      type: Boolean,
      value: false
    },
    /**
     * The error message to display when the input is invalid. If you're using
     * PaperInputBehavior to implement your own paper-input-like element,
     * bind this to the `<paper-input-error>`'s content, if using.
     */errorMessage: {
      type: String
    },
    /**
     * Set to true to show a character counter.
     */charCounter: {
      type: Boolean,
      value: false
    },
    /**
     * Set to true to disable the floating label. If you're using
     * PaperInputBehavior to implement your own paper-input-like element, bind
     * this to the `<paper-input-container>`'s `noLabelFloat` property.
     */noLabelFloat: {
      type: Boolean,
      value: false
    },
    /**
     * Set to true to always float the label. If you're using PaperInputBehavior
     * to implement your own paper-input-like element, bind this to the
     * `<paper-input-container>`'s `alwaysFloatLabel` property.
     */alwaysFloatLabel: {
      type: Boolean,
      value: false
    },
    /**
     * Set to true to auto-validate the input value. If you're using
     * PaperInputBehavior to implement your own paper-input-like element, bind
     * this to the `<paper-input-container>`'s `autoValidate` property.
     */autoValidate: {
      type: Boolean,
      value: false
    },
    /**
     * Name of the validator to use. If you're using PaperInputBehavior to
     * implement your own paper-input-like element, bind this to
     * the `<input is="iron-input">`'s `validator` property.
     */validator: {
      type: String
    },
    // HTMLInputElement attributes for binding if needed
    /**
     * If you're using PaperInputBehavior to implement your own paper-input-like
     * element, bind this to the `<input is="iron-input">`'s `autocomplete`
     * property.
     */autocomplete: {
      type: String,
      value: 'off'
    },
    /**
     * If you're using PaperInputBehavior to implement your own paper-input-like
     * element, bind this to the `<input is="iron-input">`'s `autofocus`
     * property.
     */autofocus: {
      type: Boolean,
      observer: '_autofocusChanged'
    },
    /**
     * If you're using PaperInputBehavior to implement your own paper-input-like
     * element, bind this to the `<input is="iron-input">`'s `inputmode`
     * property.
     */inputmode: {
      type: String
    },
    /**
     * The minimum length of the input value.
     * If you're using PaperInputBehavior to implement your own paper-input-like
     * element, bind this to the `<input is="iron-input">`'s `minlength`
     * property.
     */minlength: {
      type: Number
    },
    /**
     * The maximum length of the input value.
     * If you're using PaperInputBehavior to implement your own paper-input-like
     * element, bind this to the `<input is="iron-input">`'s `maxlength`
     * property.
     */maxlength: {
      type: Number
    },
    /**
     * The minimum (numeric or date-time) input value.
     * If you're using PaperInputBehavior to implement your own paper-input-like
     * element, bind this to the `<input is="iron-input">`'s `min` property.
     */min: {
      type: String
    },
    /**
     * The maximum (numeric or date-time) input value.
     * Can be a String (e.g. `"2000-01-01"`) or a Number (e.g. `2`).
     * If you're using PaperInputBehavior to implement your own paper-input-like
     * element, bind this to the `<input is="iron-input">`'s `max` property.
     */max: {
      type: String
    },
    /**
     * Limits the numeric or date-time increments.
     * If you're using PaperInputBehavior to implement your own paper-input-like
     * element, bind this to the `<input is="iron-input">`'s `step` property.
     */step: {
      type: String
    },
    /**
     * If you're using PaperInputBehavior to implement your own paper-input-like
     * element, bind this to the `<input is="iron-input">`'s `name` property.
     */name: {
      type: String
    },
    /**
     * A placeholder string in addition to the label. If this is set, the label
     * will always float.
     */placeholder: {
      type: String,
      // need to set a default so _computeAlwaysFloatLabel is run
      value: ''
    },
    /**
     * If you're using PaperInputBehavior to implement your own paper-input-like
     * element, bind this to the `<input is="iron-input">`'s `readonly`
     * property.
     */readonly: {
      type: Boolean,
      value: false
    },
    /**
     * If you're using PaperInputBehavior to implement your own paper-input-like
     * element, bind this to the `<input is="iron-input">`'s `size` property.
     */size: {
      type: Number
    },
    // Nonstandard attributes for binding if needed
    /**
     * If you're using PaperInputBehavior to implement your own paper-input-like
     * element, bind this to the `<input is="iron-input">`'s `autocapitalize`
     * property.
     */autocapitalize: {
      type: String,
      value: 'none'
    },
    /**
     * If you're using PaperInputBehavior to implement your own paper-input-like
     * element, bind this to the `<input is="iron-input">`'s `autocorrect`
     * property.
     */autocorrect: {
      type: String,
      value: 'off'
    },
    /**
     * If you're using PaperInputBehavior to implement your own paper-input-like
     * element, bind this to the `<input is="iron-input">`'s `autosave`
     * property, used with type=search.
     */autosave: {
      type: String
    },
    /**
     * If you're using PaperInputBehavior to implement your own paper-input-like
     * element, bind this to the `<input is="iron-input">`'s `results` property,
     * used with type=search.
     */results: {
      type: Number
    },
    /**
     * If you're using PaperInputBehavior to implement your own paper-input-like
     * element, bind this to the `<input is="iron-input">`'s `accept` property,
     * used with type=file.
     */accept: {
      type: String
    },
    /**
     * If you're using PaperInputBehavior to implement your own paper-input-like
     * element, bind this to the`<input is="iron-input">`'s `multiple` property,
     * used with type=file.
     */multiple: {
      type: Boolean
    },
    /** @private */_ariaDescribedBy: {
      type: String,
      value: ''
    },
    /** @private */_ariaLabelledBy: {
      type: String,
      value: ''
    },
    /** @private */_inputId: {
      type: String,
      value: ''
    }
  },
  listeners: {
    'addon-attached': '_onAddonAttached'
  },
  /**
   * @type {!Object}
   */keyBindings: {
    'shift+tab:keydown': '_onShiftTabDown'
  },
  /** @private */hostAttributes: {
    tabindex: 0
  },

  /**
   * Returns a reference to the input element.
   * @return {!HTMLElement}
   */get inputElement() {
    // Chrome generates audit errors if an <input type="password"> has a
    // duplicate ID, which is almost always true in Shady DOM. Generate
    // a unique ID instead.
    if (!this.$) {
      this.$ = {};
    }

    if (!this.$.input) {
      this._generateInputId();

      this.$.input = this.$$('#' + this._inputId);
    }

    return this.$.input;
  },

  /**
   * Returns a reference to the focusable element.
   * @return {!HTMLElement}
   */get _focusableElement() {
    return this.inputElement;
  },

  created: function () {
    // These types have some default placeholder text; overlapping
    // the label on top of it looks terrible. Auto-float the label in this case.
    this._typesThatHaveText = ['date', 'datetime', 'datetime-local', 'month', 'time', 'week', 'file'];
  },
  attached: function () {
    this._updateAriaLabelledBy(); // In the 2.0 version of the element, this is handled in `onIronInputReady`,
    // i.e. after the native input has finished distributing. In the 1.0
    // version, the input is in the shadow tree, so it's already available.


    if (!PolymerElement && this.inputElement && this._typesThatHaveText.indexOf(this.inputElement.type) !== -1) {
      this.alwaysFloatLabel = true;
    }
  },
  _appendStringWithSpace: function (str, more) {
    if (str) {
      str = str + ' ' + more;
    } else {
      str = more;
    }

    return str;
  },
  _onAddonAttached: function (event) {
    var target = dom(event).rootTarget;

    if (target.id) {
      this._ariaDescribedBy = this._appendStringWithSpace(this._ariaDescribedBy, target.id);
    } else {
      var id = 'paper-input-add-on-' + PaperInputHelper.NextAddonID++;
      target.id = id;
      this._ariaDescribedBy = this._appendStringWithSpace(this._ariaDescribedBy, id);
    }
  },
  /**
   * Validates the input element and sets an error style if needed.
   *
   * @return {boolean}
   */validate: function () {
    return this.inputElement.validate();
  },
  /**
   * Forward focus to inputElement. Overriden from IronControlState.
   */_focusBlurHandler: function (event) {
    IronControlState._focusBlurHandler.call(this, event); // Forward the focus to the nested input.


    if (this.focused && !this._shiftTabPressed && this._focusableElement) {
      this._focusableElement.focus();
    }
  },
  /**
   * Handler that is called when a shift+tab keypress is detected by the menu.
   *
   * @param {CustomEvent} event A key combination event.
   */_onShiftTabDown: function (event) {
    var oldTabIndex = this.getAttribute('tabindex');
    this._shiftTabPressed = true;
    this.setAttribute('tabindex', '-1');
    this.async(function () {
      this.setAttribute('tabindex', oldTabIndex);
      this._shiftTabPressed = false;
    }, 1);
  },
  /**
   * If `autoValidate` is true, then validates the element.
   */_handleAutoValidate: function () {
    if (this.autoValidate) this.validate();
  },
  /**
   * Restores the cursor to its original position after updating the value.
   * @param {string} newValue The value that should be saved.
   */updateValueAndPreserveCaret: function (newValue) {
    // Not all elements might have selection, and even if they have the
    // right properties, accessing them might throw an exception (like for
    // <input type=number>)
    try {
      var start = this.inputElement.selectionStart;
      this.value = newValue; // The cursor automatically jumps to the end after re-setting the value,
      // so restore it to its original position.

      this.inputElement.selectionStart = start;
      this.inputElement.selectionEnd = start;
    } catch (e) {
      // Just set the value and give up on the caret.
      this.value = newValue;
    }
  },
  _computeAlwaysFloatLabel: function (alwaysFloatLabel, placeholder) {
    return placeholder || alwaysFloatLabel;
  },
  _updateAriaLabelledBy: function () {
    var label = dom(this.root).querySelector('label');

    if (!label) {
      this._ariaLabelledBy = '';
      return;
    }

    var labelledBy;

    if (label.id) {
      labelledBy = label.id;
    } else {
      labelledBy = 'paper-input-label-' + PaperInputHelper.NextLabelID++;
      label.id = labelledBy;
    }

    this._ariaLabelledBy = labelledBy;
  },
  _generateInputId: function () {
    if (!this._inputId || this._inputId === '') {
      this._inputId = 'input-' + PaperInputHelper.NextInputID++;
    }
  },
  _onChange: function (event) {
    // In the Shadow DOM, the `change` event is not leaked into the
    // ancestor tree, so we must do this manually.
    // See
    // https://w3c.github.io/webcomponents/spec/shadow/#events-that-are-not-leaked-into-ancestor-trees.
    if (this.shadowRoot) {
      this.fire(event.type, {
        sourceEvent: event
      }, {
        node: this,
        bubbles: event.bubbles,
        cancelable: event.cancelable
      });
    }
  },
  _autofocusChanged: function () {
    // Firefox doesn't respect the autofocus attribute if it's applied after
    // the page is loaded (Chrome/WebKit do respect it), preventing an
    // autofocus attribute specified in markup from taking effect when the
    // element is upgraded. As a workaround, if the autofocus property is set,
    // and the focus hasn't already been moved elsewhere, we take focus.
    if (this.autofocus && this._focusableElement) {
      // In IE 11, the default document.activeElement can be the page's
      // outermost html element, but there are also cases (under the
      // polyfill?) in which the activeElement is not a real HTMLElement, but
      // just a plain object. We identify the latter case as having no valid
      // activeElement.
      var activeElement = document.activeElement;
      var isActiveElementValid = activeElement instanceof HTMLElement; // Has some other element has already taken the focus?

      var isSomeElementActive = isActiveElementValid && activeElement !== document.body && activeElement !== document.documentElement; /* IE 11 */

      if (!isSomeElementActive) {
        // No specific element has taken the focus yet, so we can take it.
        this._focusableElement.focus();
      }
    }
  }
}; /** @polymerBehavior */
const PaperInputBehavior = [IronControlState, IronA11yKeysBehavior, PaperInputBehaviorImpl];
var paperInputBehavior = {
  PaperInputHelper: PaperInputHelper,
  PaperInputBehaviorImpl: PaperInputBehaviorImpl,
  PaperInputBehavior: PaperInputBehavior
}; /// BareSpecifier=@polymer\paper-input\paper-input

Polymer({
  is: 'paper-input',
  _template: html`
    <style>
      :host {
        display: block;
      }

      :host([focused]) {
        outline: none;
      }

      :host([hidden]) {
        display: none !important;
      }

      input {
        /* Firefox sets a min-width on the input, which can cause layout issues */
        min-width: 0;
      }

      /* In 1.x, the <input> is distributed to paper-input-container, which styles it.
      In 2.x the <iron-input> is distributed to paper-input-container, which styles
      it, but in order for this to work correctly, we need to reset some
      of the native input's properties to inherit (from the iron-input) */
      iron-input > input {
        @apply --paper-input-container-shared-input-style;
        font-family: inherit;
        font-weight: inherit;
        font-size: inherit;
        letter-spacing: inherit;
        word-spacing: inherit;
        line-height: inherit;
        text-shadow: inherit;
        color: inherit;
        cursor: inherit;
      }

      input:disabled {
        @apply --paper-input-container-input-disabled;
      }

      input::-webkit-outer-spin-button,
      input::-webkit-inner-spin-button {
        @apply --paper-input-container-input-webkit-spinner;
      }

      input::-webkit-clear-button {
        @apply --paper-input-container-input-webkit-clear;
      }

      input::-webkit-calendar-picker-indicator {
        @apply --paper-input-container-input-webkit-calendar-picker-indicator;
      }

      input::-webkit-input-placeholder {
        color: var(--paper-input-container-color, var(--secondary-text-color));
      }

      input:-moz-placeholder {
        color: var(--paper-input-container-color, var(--secondary-text-color));
      }

      input::-moz-placeholder {
        color: var(--paper-input-container-color, var(--secondary-text-color));
      }

      input::-ms-clear {
        @apply --paper-input-container-ms-clear;
      }

      input::-ms-reveal {
        @apply --paper-input-container-ms-reveal;
      }

      input:-ms-input-placeholder {
        color: var(--paper-input-container-color, var(--secondary-text-color));
      }

      label {
        pointer-events: none;
      }
    </style>

    <paper-input-container id="container" no-label-float="[[noLabelFloat]]" always-float-label="[[_computeAlwaysFloatLabel(alwaysFloatLabel,placeholder)]]" auto-validate\$="[[autoValidate]]" disabled\$="[[disabled]]" invalid="[[invalid]]">

      <slot name="prefix" slot="prefix"></slot>

      <label hidden\$="[[!label]]" aria-hidden="true" for\$="[[_inputId]]" slot="label">[[label]]</label>

      <!-- Need to bind maxlength so that the paper-input-char-counter works correctly -->
      <iron-input bind-value="{{value}}" slot="input" class="input-element" id\$="[[_inputId]]" maxlength\$="[[maxlength]]" allowed-pattern="[[allowedPattern]]" invalid="{{invalid}}" validator="[[validator]]">
        <input aria-labelledby\$="[[_ariaLabelledBy]]" aria-describedby\$="[[_ariaDescribedBy]]" disabled\$="[[disabled]]" title\$="[[title]]" type\$="[[type]]" pattern\$="[[pattern]]" required\$="[[required]]" autocomplete\$="[[autocomplete]]" autofocus\$="[[autofocus]]" inputmode\$="[[inputmode]]" minlength\$="[[minlength]]" maxlength\$="[[maxlength]]" min\$="[[min]]" max\$="[[max]]" step\$="[[step]]" name\$="[[name]]" placeholder\$="[[placeholder]]" readonly\$="[[readonly]]" list\$="[[list]]" size\$="[[size]]" autocapitalize\$="[[autocapitalize]]" autocorrect\$="[[autocorrect]]" on-change="_onChange" tabindex\$="[[tabIndex]]" autosave\$="[[autosave]]" results\$="[[results]]" accept\$="[[accept]]" multiple\$="[[multiple]]">
      </iron-input>

      <slot name="suffix" slot="suffix"></slot>

      <template is="dom-if" if="[[errorMessage]]">
        <paper-input-error aria-live="assertive" slot="add-on">[[errorMessage]]</paper-input-error>
      </template>

      <template is="dom-if" if="[[charCounter]]">
        <paper-input-char-counter slot="add-on"></paper-input-char-counter>
      </template>

    </paper-input-container>
  `,
  behaviors: [PaperInputBehavior, IronFormElementBehavior],
  properties: {
    value: {
      // Required for the correct TypeScript type-generation
      type: String
    }
  },

  /**
   * Returns a reference to the focusable element. Overridden from
   * PaperInputBehavior to correctly focus the native input.
   *
   * @return {!HTMLElement}
   */get _focusableElement() {
    return this.inputElement._inputElement;
  },

  // Note: This event is only available in the 1.0 version of this element.
  // In 2.0, the functionality of `_onIronInputReady` is done in
  // PaperInputBehavior::attached.
  listeners: {
    'iron-input-ready': '_onIronInputReady'
  },
  _onIronInputReady: function () {
    // Even though this is only used in the next line, save this for
    // backwards compatibility, since the native input had this ID until 2.0.5.
    if (!this.$.nativeInput) {
      this.$.nativeInput = this.$$('input');
    }

    if (this.inputElement && this._typesThatHaveText.indexOf(this.$.nativeInput.type) !== -1) {
      this.alwaysFloatLabel = true;
    } // Only validate when attached if the input already has a value.


    if (!!this.inputElement.bindValue) {
      this.$.container._handleValueAndAutoValidate(this.inputElement);
    }
  }
}); /// BareSpecifier=@polymer\paper-menu-button\paper-menu-button-animations

Polymer({
  is: 'paper-menu-grow-height-animation',
  behaviors: [NeonAnimationBehavior],
  configure: function (config) {
    var node = config.node;
    var rect = node.getBoundingClientRect();
    var height = rect.height;
    this._effect = new KeyframeEffect(node, [{
      height: height / 2 + 'px'
    }, {
      height: height + 'px'
    }], this.timingFromConfig(config));
    return this._effect;
  }
});
Polymer({
  is: 'paper-menu-grow-width-animation',
  behaviors: [NeonAnimationBehavior],
  configure: function (config) {
    var node = config.node;
    var rect = node.getBoundingClientRect();
    var width = rect.width;
    this._effect = new KeyframeEffect(node, [{
      width: width / 2 + 'px'
    }, {
      width: width + 'px'
    }], this.timingFromConfig(config));
    return this._effect;
  }
});
Polymer({
  is: 'paper-menu-shrink-width-animation',
  behaviors: [NeonAnimationBehavior],
  configure: function (config) {
    var node = config.node;
    var rect = node.getBoundingClientRect();
    var width = rect.width;
    this._effect = new KeyframeEffect(node, [{
      width: width + 'px'
    }, {
      width: width - width / 20 + 'px'
    }], this.timingFromConfig(config));
    return this._effect;
  }
});
Polymer({
  is: 'paper-menu-shrink-height-animation',
  behaviors: [NeonAnimationBehavior],
  configure: function (config) {
    var node = config.node;
    var rect = node.getBoundingClientRect();
    var height = rect.height;
    this.setPrefixedProperty(node, 'transformOrigin', '0 0');
    this._effect = new KeyframeEffect(node, [{
      height: height + 'px',
      transform: 'translateY(0)'
    }, {
      height: height / 2 + 'px',
      transform: 'translateY(-20px)'
    }], this.timingFromConfig(config));
    return this._effect;
  }
}); /// BareSpecifier=@polymer\paper-menu-button\paper-menu-button

var config = {
  ANIMATION_CUBIC_BEZIER: 'cubic-bezier(.3,.95,.5,1)',
  MAX_ANIMATION_TIME_MS: 400
}; /**
   Material design: [Dropdown
   buttons](https://www.google.com/design/spec/components/buttons.html#buttons-dropdown-buttons)
   
   `paper-menu-button` allows one to compose a designated "trigger" element with
   another element that represents "content", to create a dropdown menu that
   displays the "content" when the "trigger" is clicked.
   
   The child element assigned to the `dropdown-trigger` slot will be used as the
   "trigger" element. The child element assigned to the `dropdown-content` slot
   will be used as the "content" element.
   
   The `paper-menu-button` is sensitive to its content's `iron-select` events. If
   the "content" element triggers an `iron-select` event, the `paper-menu-button`
   will close automatically.
   
   Example:
   
       <paper-menu-button>
         <paper-icon-button icon="menu"
   slot="dropdown-trigger"></paper-icon-button> <paper-listbox
   slot="dropdown-content"> <paper-item>Share</paper-item>
           <paper-item>Settings</paper-item>
           <paper-item>Help</paper-item>
         </paper-listbox>
       </paper-menu-button>
   
   ### Styling
   
   The following custom properties and mixins are also available for styling:
   
   Custom property | Description | Default
   ----------------|-------------|----------
   `--paper-menu-button-dropdown-background` | Background color of the paper-menu-button dropdown | `--primary-background-color`
   `--paper-menu-button` | Mixin applied to the paper-menu-button | `{}`
   `--paper-menu-button-disabled` | Mixin applied to the paper-menu-button when disabled | `{}`
   `--paper-menu-button-dropdown` | Mixin applied to the paper-menu-button dropdown | `{}`
   `--paper-menu-button-content` | Mixin applied to the paper-menu-button content | `{}`
   
   @hero hero.svg
   @demo demo/index.html
   */
const PaperMenuButton = Polymer({
  _template: html`
    <style>
      :host {
        display: inline-block;
        position: relative;
        padding: 8px;
        outline: none;

        @apply --paper-menu-button;
      }

      :host([disabled]) {
        cursor: auto;
        color: var(--disabled-text-color);

        @apply --paper-menu-button-disabled;
      }

      iron-dropdown {
        @apply --paper-menu-button-dropdown;
      }

      .dropdown-content {
        @apply --shadow-elevation-2dp;

        position: relative;
        border-radius: 2px;
        background-color: var(--paper-menu-button-dropdown-background, var(--primary-background-color));

        @apply --paper-menu-button-content;
      }

      :host([vertical-align="top"]) .dropdown-content {
        margin-bottom: 20px;
        margin-top: -10px;
        top: 10px;
      }

      :host([vertical-align="bottom"]) .dropdown-content {
        bottom: 10px;
        margin-bottom: -10px;
        margin-top: 20px;
      }

      #trigger {
        cursor: pointer;
      }
    </style>

    <div id="trigger" on-tap="toggle">
      <slot name="dropdown-trigger"></slot>
    </div>

    <iron-dropdown id="dropdown" opened="{{opened}}" horizontal-align="[[horizontalAlign]]" vertical-align="[[verticalAlign]]" dynamic-align="[[dynamicAlign]]" horizontal-offset="[[horizontalOffset]]" vertical-offset="[[verticalOffset]]" no-overlap="[[noOverlap]]" open-animation-config="[[openAnimationConfig]]" close-animation-config="[[closeAnimationConfig]]" no-animations="[[noAnimations]]" focus-target="[[_dropdownContent]]" allow-outside-scroll="[[allowOutsideScroll]]" restore-focus-on-close="[[restoreFocusOnClose]]" on-iron-overlay-canceled="__onIronOverlayCanceled">
      <div slot="dropdown-content" class="dropdown-content">
        <slot id="content" name="dropdown-content"></slot>
      </div>
    </iron-dropdown>
`,
  is: 'paper-menu-button',
  /**
   * Fired when the dropdown opens.
   *
   * @event paper-dropdown-open
   */ /**
       * Fired when the dropdown closes.
       *
       * @event paper-dropdown-close
       */behaviors: [IronA11yKeysBehavior, IronControlState],
  properties: {
    /**
     * True if the content is currently displayed.
     */opened: {
      type: Boolean,
      value: false,
      notify: true,
      observer: '_openedChanged'
    },
    /**
     * The orientation against which to align the menu dropdown
     * horizontally relative to the dropdown trigger.
     */horizontalAlign: {
      type: String,
      value: 'left',
      reflectToAttribute: true
    },
    /**
     * The orientation against which to align the menu dropdown
     * vertically relative to the dropdown trigger.
     */verticalAlign: {
      type: String,
      value: 'top',
      reflectToAttribute: true
    },
    /**
     * If true, the `horizontalAlign` and `verticalAlign` properties will
     * be considered preferences instead of strict requirements when
     * positioning the dropdown and may be changed if doing so reduces
     * the area of the dropdown falling outside of `fitInto`.
     */dynamicAlign: {
      type: Boolean
    },
    /**
     * A pixel value that will be added to the position calculated for the
     * given `horizontalAlign`. Use a negative value to offset to the
     * left, or a positive value to offset to the right.
     */horizontalOffset: {
      type: Number,
      value: 0,
      notify: true
    },
    /**
     * A pixel value that will be added to the position calculated for the
     * given `verticalAlign`. Use a negative value to offset towards the
     * top, or a positive value to offset towards the bottom.
     */verticalOffset: {
      type: Number,
      value: 0,
      notify: true
    },
    /**
     * If true, the dropdown will be positioned so that it doesn't overlap
     * the button.
     */noOverlap: {
      type: Boolean
    },
    /**
     * Set to true to disable animations when opening and closing the
     * dropdown.
     */noAnimations: {
      type: Boolean,
      value: false
    },
    /**
     * Set to true to disable automatically closing the dropdown after
     * a selection has been made.
     */ignoreSelect: {
      type: Boolean,
      value: false
    },
    /**
     * Set to true to enable automatically closing the dropdown after an
     * item has been activated, even if the selection did not change.
     */closeOnActivate: {
      type: Boolean,
      value: false
    },
    /**
     * An animation config. If provided, this will be used to animate the
     * opening of the dropdown.
     */openAnimationConfig: {
      type: Object,
      value: function () {
        return [{
          name: 'fade-in-animation',
          timing: {
            delay: 100,
            duration: 200
          }
        }, {
          name: 'paper-menu-grow-width-animation',
          timing: {
            delay: 100,
            duration: 150,
            easing: config.ANIMATION_CUBIC_BEZIER
          }
        }, {
          name: 'paper-menu-grow-height-animation',
          timing: {
            delay: 100,
            duration: 275,
            easing: config.ANIMATION_CUBIC_BEZIER
          }
        }];
      }
    },
    /**
     * An animation config. If provided, this will be used to animate the
     * closing of the dropdown.
     */closeAnimationConfig: {
      type: Object,
      value: function () {
        return [{
          name: 'fade-out-animation',
          timing: {
            duration: 150
          }
        }, {
          name: 'paper-menu-shrink-width-animation',
          timing: {
            delay: 100,
            duration: 50,
            easing: config.ANIMATION_CUBIC_BEZIER
          }
        }, {
          name: 'paper-menu-shrink-height-animation',
          timing: {
            duration: 200,
            easing: 'ease-in'
          }
        }];
      }
    },
    /**
     * By default, the dropdown will constrain scrolling on the page
     * to itself when opened.
     * Set to true in order to prevent scroll from being constrained
     * to the dropdown when it opens.
     */allowOutsideScroll: {
      type: Boolean,
      value: false
    },
    /**
     * Whether focus should be restored to the button when the menu closes.
     */restoreFocusOnClose: {
      type: Boolean,
      value: true
    },
    /**
     * This is the element intended to be bound as the focus target
     * for the `iron-dropdown` contained by `paper-menu-button`.
     */_dropdownContent: {
      type: Object
    }
  },
  hostAttributes: {
    role: 'group',
    'aria-haspopup': 'true'
  },
  listeners: {
    'iron-activate': '_onIronActivate',
    'iron-select': '_onIronSelect'
  },

  /**
   * The content element that is contained by the menu button, if any.
   */get contentElement() {
    // Polymer 2.x returns slot.assignedNodes which can contain text nodes.
    var nodes = dom(this.$.content).getDistributedNodes();

    for (var i = 0, l = nodes.length; i < l; i++) {
      if (nodes[i].nodeType === Node.ELEMENT_NODE) {
        return nodes[i];
      }
    }
  },

  /**
   * Toggles the dropdown content between opened and closed.
   */toggle: function () {
    if (this.opened) {
      this.close();
    } else {
      this.open();
    }
  },
  /**
   * Make the dropdown content appear as an overlay positioned relative
   * to the dropdown trigger.
   */open: function () {
    if (this.disabled) {
      return;
    }

    this.$.dropdown.open();
  },
  /**
   * Hide the dropdown content.
   */close: function () {
    this.$.dropdown.close();
  },
  /**
   * When an `iron-select` event is received, the dropdown should
   * automatically close on the assumption that a value has been chosen.
   *
   * @param {CustomEvent} event A CustomEvent instance with type
   * set to `"iron-select"`.
   */_onIronSelect: function (event) {
    if (!this.ignoreSelect) {
      this.close();
    }
  },
  /**
   * Closes the dropdown when an `iron-activate` event is received if
   * `closeOnActivate` is true.
   *
   * @param {CustomEvent} event A CustomEvent of type 'iron-activate'.
   */_onIronActivate: function (event) {
    if (this.closeOnActivate) {
      this.close();
    }
  },
  /**
   * When the dropdown opens, the `paper-menu-button` fires `paper-open`.
   * When the dropdown closes, the `paper-menu-button` fires `paper-close`.
   *
   * @param {boolean} opened True if the dropdown is opened, otherwise false.
   * @param {boolean} oldOpened The previous value of `opened`.
   */_openedChanged: function (opened, oldOpened) {
    if (opened) {
      // TODO(cdata): Update this when we can measure changes in distributed
      // children in an idiomatic way.
      // We poke this property in case the element has changed. This will
      // cause the focus target for the `iron-dropdown` to be updated as
      // necessary:
      this._dropdownContent = this.contentElement;
      this.fire('paper-dropdown-open');
    } else if (oldOpened != null) {
      this.fire('paper-dropdown-close');
    }
  },
  /**
   * If the dropdown is open when disabled becomes true, close the
   * dropdown.
   *
   * @param {boolean} disabled True if disabled, otherwise false.
   */_disabledChanged: function (disabled) {
    IronControlState._disabledChanged.apply(this, arguments);

    if (disabled && this.opened) {
      this.close();
    }
  },
  __onIronOverlayCanceled: function (event) {
    var uiEvent = event.detail;
    var trigger = this.$.trigger;
    var path = dom(uiEvent).path;

    if (path.indexOf(trigger) > -1) {
      event.preventDefault();
    }
  }
});
Object.keys(config).forEach(function (key) {
  PaperMenuButton[key] = config[key];
});
var paperMenuButton = {
  PaperMenuButton: PaperMenuButton
}; /// BareSpecifier=@polymer\paper-dropdown-menu\paper-dropdown-menu

Polymer({
  _template: html`
    <style include="paper-dropdown-menu-shared-styles"></style>

    <!-- this div fulfills an a11y requirement for combobox, do not remove -->
    <span role="button"></span>
    <paper-menu-button id="menuButton" vertical-align="[[verticalAlign]]" horizontal-align="[[horizontalAlign]]" dynamic-align="[[dynamicAlign]]" vertical-offset="[[_computeMenuVerticalOffset(noLabelFloat, verticalOffset)]]" disabled="[[disabled]]" no-animations="[[noAnimations]]" on-iron-select="_onIronSelect" on-iron-deselect="_onIronDeselect" opened="{{opened}}" close-on-activate allow-outside-scroll="[[allowOutsideScroll]]" restore-focus-on-close="[[restoreFocusOnClose]]">
      <!-- support hybrid mode: user might be using paper-menu-button 1.x which distributes via <content> -->
      <div class="dropdown-trigger" slot="dropdown-trigger">
        <paper-ripple></paper-ripple>
        <!-- paper-input has type="text" for a11y, do not remove -->
        <paper-input type="text" invalid="[[invalid]]" readonly disabled="[[disabled]]" value="[[value]]" placeholder="[[placeholder]]" error-message="[[errorMessage]]" always-float-label="[[alwaysFloatLabel]]" no-label-float="[[noLabelFloat]]" label="[[label]]">
          <!-- support hybrid mode: user might be using paper-input 1.x which distributes via <content> -->
          <iron-icon icon="paper-dropdown-menu:arrow-drop-down" suffix slot="suffix"></iron-icon>
        </paper-input>
      </div>
      <slot id="content" name="dropdown-content" slot="dropdown-content"></slot>
    </paper-menu-button>
`,
  is: 'paper-dropdown-menu',
  behaviors: [IronButtonState, IronControlState, IronFormElementBehavior, IronValidatableBehavior],
  properties: {
    /**
     * The derived "label" of the currently selected item. This value
     * is the `label` property on the selected item if set, or else the
     * trimmed text content of the selected item.
     */selectedItemLabel: {
      type: String,
      notify: true,
      readOnly: true
    },
    /**
     * The last selected item. An item is selected if the dropdown menu has
     * a child with slot `dropdown-content`, and that child triggers an
     * `iron-select` event with the selected `item` in the `detail`.
     *
     * @type {?Object}
     */selectedItem: {
      type: Object,
      notify: true,
      readOnly: true
    },
    /**
     * The value for this element that will be used when submitting in
     * a form. It reflects the value of `selectedItemLabel`. If set directly,
     * it will not update the `selectedItemLabel` value.
     */value: {
      type: String,
      notify: true
    },
    /**
     * The label for the dropdown.
     */label: {
      type: String
    },
    /**
     * The placeholder for the dropdown.
     */placeholder: {
      type: String
    },
    /**
     * The error message to display when invalid.
     */errorMessage: {
      type: String
    },
    /**
     * True if the dropdown is open. Otherwise, false.
     */opened: {
      type: Boolean,
      notify: true,
      value: false,
      observer: '_openedChanged'
    },
    /**
     * By default, the dropdown will constrain scrolling on the page
     * to itself when opened.
     * Set to true in order to prevent scroll from being constrained
     * to the dropdown when it opens.
     */allowOutsideScroll: {
      type: Boolean,
      value: false
    },
    /**
     * Set to true to disable the floating label. Bind this to the
     * `<paper-input-container>`'s `noLabelFloat` property.
     */noLabelFloat: {
      type: Boolean,
      value: false,
      reflectToAttribute: true
    },
    /**
     * Set to true to always float the label. Bind this to the
     * `<paper-input-container>`'s `alwaysFloatLabel` property.
     */alwaysFloatLabel: {
      type: Boolean,
      value: false
    },
    /**
     * Set to true to disable animations when opening and closing the
     * dropdown.
     */noAnimations: {
      type: Boolean,
      value: false
    },
    /**
     * The orientation against which to align the menu dropdown
     * horizontally relative to the dropdown trigger.
     */horizontalAlign: {
      type: String,
      value: 'right'
    },
    /**
     * The orientation against which to align the menu dropdown
     * vertically relative to the dropdown trigger.
     */verticalAlign: {
      type: String,
      value: 'top'
    },
    /**
     * Overrides the vertical offset computed in
     * _computeMenuVerticalOffset.
     */verticalOffset: Number,
    /**
     * If true, the `horizontalAlign` and `verticalAlign` properties will
     * be considered preferences instead of strict requirements when
     * positioning the dropdown and may be changed if doing so reduces
     * the area of the dropdown falling outside of `fitInto`.
     */dynamicAlign: {
      type: Boolean
    },
    /**
     * Whether focus should be restored to the dropdown when the menu closes.
     */restoreFocusOnClose: {
      type: Boolean,
      value: true
    }
  },
  listeners: {
    'tap': '_onTap'
  },
  /**
   * @type {!Object}
   */keyBindings: {
    'up down': 'open',
    'esc': 'close'
  },
  hostAttributes: {
    role: 'combobox',
    'aria-autocomplete': 'none',
    'aria-haspopup': 'true'
  },
  observers: ['_selectedItemChanged(selectedItem)'],
  attached: function () {
    // NOTE(cdata): Due to timing, a preselected value in a `IronSelectable`
    // child will cause an `iron-select` event to fire while the element is
    // still in a `DocumentFragment`. This has the effect of causing
    // handlers not to fire. So, we double check this value on attached:
    var contentElement = this.contentElement;

    if (contentElement && contentElement.selectedItem) {
      this._setSelectedItem(contentElement.selectedItem);
    }
  },

  /**
   * The content element that is contained by the dropdown menu, if any.
   */get contentElement() {
    // Polymer 2.x returns slot.assignedNodes which can contain text nodes.
    var nodes = dom(this.$.content).getDistributedNodes();

    for (var i = 0, l = nodes.length; i < l; i++) {
      if (nodes[i].nodeType === Node.ELEMENT_NODE) {
        return nodes[i];
      }
    }
  },

  /**
   * Show the dropdown content.
   */open: function () {
    this.$.menuButton.open();
  },
  /**
   * Hide the dropdown content.
   */close: function () {
    this.$.menuButton.close();
  },
  /**
   * A handler that is called when `iron-select` is fired.
   *
   * @param {CustomEvent} event An `iron-select` event.
   */_onIronSelect: function (event) {
    this._setSelectedItem(event.detail.item);
  },
  /**
   * A handler that is called when `iron-deselect` is fired.
   *
   * @param {CustomEvent} event An `iron-deselect` event.
   */_onIronDeselect: function (event) {
    this._setSelectedItem(null);
  },
  /**
   * A handler that is called when the dropdown is tapped.
   *
   * @param {CustomEvent} event A tap event.
   */_onTap: function (event) {
    if (findOriginalTarget(event) === this) {
      this.open();
    }
  },
  /**
   * Compute the label for the dropdown given a selected item.
   *
   * @param {Element} selectedItem A selected Element item, with an
   * optional `label` property.
   */_selectedItemChanged: function (selectedItem) {
    var value = '';

    if (!selectedItem) {
      value = '';
    } else {
      value = selectedItem.label || selectedItem.getAttribute('label') || selectedItem.textContent.trim();
    }

    this.value = value;

    this._setSelectedItemLabel(value);
  },
  /**
   * Compute the vertical offset of the menu based on the value of
   * `noLabelFloat`.
   *
   * @param {boolean} noLabelFloat True if the label should not float
   * @param {number=} opt_verticalOffset Optional offset from the user
   * above the input, otherwise false.
   */_computeMenuVerticalOffset: function (noLabelFloat, opt_verticalOffset) {
    // Override offset if it's passed from the user.
    if (opt_verticalOffset) {
      return opt_verticalOffset;
    } // NOTE(cdata): These numbers are somewhat magical because they are
    // derived from the metrics of elements internal to `paper-input`'s
    // template. The metrics will change depending on whether or not the
    // input has a floating label.


    return noLabelFloat ? -4 : 8;
  },
  /**
   * Returns false if the element is required and does not have a selection,
   * and true otherwise.
   * @param {*=} _value Ignored.
   * @return {boolean} true if `required` is false, or if `required` is true
   * and the element has a valid selection.
   */_getValidity: function (_value) {
    return this.disabled || !this.required || this.required && !!this.value;
  },
  _openedChanged: function () {
    var openState = this.opened ? 'true' : 'false';
    var e = this.contentElement;

    if (e) {
      e.setAttribute('aria-expanded', openState);
    }
  }
}); /// BareSpecifier=@polymer\paper-item\paper-item-shared-styles

const $_documentContainer$3 = document.createElement('template');
$_documentContainer$3.setAttribute('style', 'display: none;');
$_documentContainer$3.innerHTML = `<dom-module id="paper-item-shared-styles">
  <template>
    <style>
      :host, .paper-item {
        display: block;
        position: relative;
        min-height: var(--paper-item-min-height, 48px);
        padding: 0px 16px;
      }

      .paper-item {
        @apply --paper-font-subhead;
        border:none;
        outline: none;
        background: white;
        width: 100%;
        text-align: left;
      }

      :host([hidden]), .paper-item[hidden] {
        display: none !important;
      }

      :host(.iron-selected), .paper-item.iron-selected {
        font-weight: var(--paper-item-selected-weight, bold);

        @apply --paper-item-selected;
      }

      :host([disabled]), .paper-item[disabled] {
        color: var(--paper-item-disabled-color, var(--disabled-text-color));

        @apply --paper-item-disabled;
      }

      :host(:focus), .paper-item:focus {
        position: relative;
        outline: 0;

        @apply --paper-item-focused;
      }

      :host(:focus):before, .paper-item:focus:before {
        @apply --layout-fit;

        background: currentColor;
        content: '';
        opacity: var(--dark-divider-opacity);
        pointer-events: none;

        @apply --paper-item-focused-before;
      }
    </style>
  </template>
</dom-module>`;
document.head.appendChild($_documentContainer$3.content); /// BareSpecifier=@polymer\paper-item\paper-item-behavior

const PaperItemBehaviorImpl = {
  hostAttributes: {
    role: 'option',
    tabindex: '0'
  }
}; /** @polymerBehavior */
const PaperItemBehavior = [IronButtonState, IronControlState, PaperItemBehaviorImpl];
var paperItemBehavior = {
  PaperItemBehaviorImpl: PaperItemBehaviorImpl,
  PaperItemBehavior: PaperItemBehavior
}; /// BareSpecifier=@polymer\paper-item\paper-item

Polymer({
  _template: html`
    <style include="paper-item-shared-styles">
      :host {
        @apply --layout-horizontal;
        @apply --layout-center;
        @apply --paper-font-subhead;

        @apply --paper-item;
      }
    </style>
    <slot></slot>
`,
  is: 'paper-item',
  behaviors: [PaperItemBehavior]
}); /// BareSpecifier=@polymer\paper-item\paper-item-body

Polymer({
  _template: html`
    <style>
      :host {
        overflow: hidden; /* needed for text-overflow: ellipsis to work on ff */
        @apply --layout-vertical;
        @apply --layout-center-justified;
        @apply --layout-flex;
      }

      :host([two-line]) {
        min-height: var(--paper-item-body-two-line-min-height, 72px);
      }

      :host([three-line]) {
        min-height: var(--paper-item-body-three-line-min-height, 88px);
      }

      :host > ::slotted(*) {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      :host > ::slotted([secondary]) {
        @apply --paper-font-body1;

        color: var(--paper-item-body-secondary-color, var(--secondary-text-color));

        @apply --paper-item-body-secondary;
      }
    </style>

    <slot></slot>
`,
  is: 'paper-item-body'
}); /// BareSpecifier=@polymer\paper-item\paper-icon-item

Polymer({
  _template: html`
    <style include="paper-item-shared-styles"></style>
    <style>
      :host {
        @apply --layout-horizontal;
        @apply --layout-center;
        @apply --paper-font-subhead;

        @apply --paper-item;
        @apply --paper-icon-item;
      }

      .content-icon {
        @apply --layout-horizontal;
        @apply --layout-center;

        width: var(--paper-item-icon-width, 56px);
        @apply --paper-item-icon;
      }
    </style>

    <div id="contentIcon" class="content-icon">
      <slot name="item-icon"></slot>
    </div>
    <slot></slot>
`,
  is: 'paper-icon-item',
  behaviors: [PaperItemBehavior]
}); /// BareSpecifier=@polymer\paper-item\all-imports
/// BareSpecifier=@polymer\paper-listbox\paper-listbox

Polymer({
  _template: html`
    <style>
      :host {
        display: block;
        padding: 8px 0;

        background: var(--paper-listbox-background-color, var(--primary-background-color));
        color: var(--paper-listbox-color, var(--primary-text-color));

        @apply --paper-listbox;
      }
    </style>

    <slot></slot>
`,
  is: 'paper-listbox',
  behaviors: [IronMenuBehavior],
  /** @private */hostAttributes: {
    role: 'listbox'
  }
}); /// BareSpecifier=@polymer\paper-progress\paper-progress

Polymer({
  _template: html`
    <style>
      :host {
        display: block;
        width: 200px;
        position: relative;
        overflow: hidden;
      }

      :host([hidden]), [hidden] {
        display: none !important;
      }

      #progressContainer {
        @apply --paper-progress-container;
        position: relative;
      }

      #progressContainer,
      /* the stripe for the indeterminate animation*/
      .indeterminate::after {
        height: var(--paper-progress-height, 4px);
      }

      #primaryProgress,
      #secondaryProgress,
      .indeterminate::after {
        @apply --layout-fit;
      }

      #progressContainer,
      .indeterminate::after {
        background: var(--paper-progress-container-color, var(--google-grey-300));
      }

      :host(.transiting) #primaryProgress,
      :host(.transiting) #secondaryProgress {
        -webkit-transition-property: -webkit-transform;
        transition-property: transform;

        /* Duration */
        -webkit-transition-duration: var(--paper-progress-transition-duration, 0.08s);
        transition-duration: var(--paper-progress-transition-duration, 0.08s);

        /* Timing function */
        -webkit-transition-timing-function: var(--paper-progress-transition-timing-function, ease);
        transition-timing-function: var(--paper-progress-transition-timing-function, ease);

        /* Delay */
        -webkit-transition-delay: var(--paper-progress-transition-delay, 0s);
        transition-delay: var(--paper-progress-transition-delay, 0s);
      }

      #primaryProgress,
      #secondaryProgress {
        @apply --layout-fit;
        -webkit-transform-origin: left center;
        transform-origin: left center;
        -webkit-transform: scaleX(0);
        transform: scaleX(0);
        will-change: transform;
      }

      #primaryProgress {
        background: var(--paper-progress-active-color, var(--google-green-500));
      }

      #secondaryProgress {
        background: var(--paper-progress-secondary-color, var(--google-green-100));
      }

      :host([disabled]) #primaryProgress {
        background: var(--paper-progress-disabled-active-color, var(--google-grey-500));
      }

      :host([disabled]) #secondaryProgress {
        background: var(--paper-progress-disabled-secondary-color, var(--google-grey-300));
      }

      :host(:not([disabled])) #primaryProgress.indeterminate {
        -webkit-transform-origin: right center;
        transform-origin: right center;
        -webkit-animation: indeterminate-bar var(--paper-progress-indeterminate-cycle-duration, 2s) linear infinite;
        animation: indeterminate-bar var(--paper-progress-indeterminate-cycle-duration, 2s) linear infinite;
      }

      :host(:not([disabled])) #primaryProgress.indeterminate::after {
        content: "";
        -webkit-transform-origin: center center;
        transform-origin: center center;

        -webkit-animation: indeterminate-splitter var(--paper-progress-indeterminate-cycle-duration, 2s) linear infinite;
        animation: indeterminate-splitter var(--paper-progress-indeterminate-cycle-duration, 2s) linear infinite;
      }

      @-webkit-keyframes indeterminate-bar {
        0% {
          -webkit-transform: scaleX(1) translateX(-100%);
        }
        50% {
          -webkit-transform: scaleX(1) translateX(0%);
        }
        75% {
          -webkit-transform: scaleX(1) translateX(0%);
          -webkit-animation-timing-function: cubic-bezier(.28,.62,.37,.91);
        }
        100% {
          -webkit-transform: scaleX(0) translateX(0%);
        }
      }

      @-webkit-keyframes indeterminate-splitter {
        0% {
          -webkit-transform: scaleX(.75) translateX(-125%);
        }
        30% {
          -webkit-transform: scaleX(.75) translateX(-125%);
          -webkit-animation-timing-function: cubic-bezier(.42,0,.6,.8);
        }
        90% {
          -webkit-transform: scaleX(.75) translateX(125%);
        }
        100% {
          -webkit-transform: scaleX(.75) translateX(125%);
        }
      }

      @keyframes indeterminate-bar {
        0% {
          transform: scaleX(1) translateX(-100%);
        }
        50% {
          transform: scaleX(1) translateX(0%);
        }
        75% {
          transform: scaleX(1) translateX(0%);
          animation-timing-function: cubic-bezier(.28,.62,.37,.91);
        }
        100% {
          transform: scaleX(0) translateX(0%);
        }
      }

      @keyframes indeterminate-splitter {
        0% {
          transform: scaleX(.75) translateX(-125%);
        }
        30% {
          transform: scaleX(.75) translateX(-125%);
          animation-timing-function: cubic-bezier(.42,0,.6,.8);
        }
        90% {
          transform: scaleX(.75) translateX(125%);
        }
        100% {
          transform: scaleX(.75) translateX(125%);
        }
      }
    </style>

    <div id="progressContainer">
      <div id="secondaryProgress" hidden\$="[[_hideSecondaryProgress(secondaryRatio)]]"></div>
      <div id="primaryProgress"></div>
    </div>
`,
  is: 'paper-progress',
  behaviors: [IronRangeBehavior],
  properties: {
    /**
     * The number that represents the current secondary progress.
     */secondaryProgress: {
      type: Number,
      value: 0
    },
    /**
     * The secondary ratio
     */secondaryRatio: {
      type: Number,
      value: 0,
      readOnly: true
    },
    /**
     * Use an indeterminate progress indicator.
     */indeterminate: {
      type: Boolean,
      value: false,
      observer: '_toggleIndeterminate'
    },
    /**
     * True if the progress is disabled.
     */disabled: {
      type: Boolean,
      value: false,
      reflectToAttribute: true,
      observer: '_disabledChanged'
    }
  },
  observers: ['_progressChanged(secondaryProgress, value, min, max, indeterminate)'],
  hostAttributes: {
    role: 'progressbar'
  },
  _toggleIndeterminate: function (indeterminate) {
    // If we use attribute/class binding, the animation sometimes doesn't
    // translate properly on Safari 7.1. So instead, we toggle the class here in
    // the update method.
    this.toggleClass('indeterminate', indeterminate, this.$.primaryProgress);
  },
  _transformProgress: function (progress, ratio) {
    var transform = 'scaleX(' + ratio / 100 + ')';
    progress.style.transform = progress.style.webkitTransform = transform;
  },
  _mainRatioChanged: function (ratio) {
    this._transformProgress(this.$.primaryProgress, ratio);
  },
  _progressChanged: function (secondaryProgress, value, min, max, indeterminate) {
    secondaryProgress = this._clampValue(secondaryProgress);
    value = this._clampValue(value);
    var secondaryRatio = this._calcRatio(secondaryProgress) * 100;
    var mainRatio = this._calcRatio(value) * 100;

    this._setSecondaryRatio(secondaryRatio);

    this._transformProgress(this.$.secondaryProgress, secondaryRatio);

    this._transformProgress(this.$.primaryProgress, mainRatio);

    this.secondaryProgress = secondaryProgress;

    if (indeterminate) {
      this.removeAttribute('aria-valuenow');
    } else {
      this.setAttribute('aria-valuenow', value);
    }

    this.setAttribute('aria-valuemin', min);
    this.setAttribute('aria-valuemax', max);
  },
  _disabledChanged: function (disabled) {
    this.setAttribute('aria-disabled', disabled ? 'true' : 'false');
  },
  _hideSecondaryProgress: function (secondaryRatio) {
    return secondaryRatio === 0;
  }
}); /// BareSpecifier=@polymer\paper-radio-button\paper-radio-button

const template$6 = html`
<style>
  :host {
    display: inline-block;
    line-height: 0;
    white-space: nowrap;
    cursor: pointer;
    @apply --paper-font-common-base;
    --calculated-paper-radio-button-size: var(--paper-radio-button-size, 16px);
    /* -1px is a sentinel for the default and is replace in \`attached\`. */
    --calculated-paper-radio-button-ink-size: var(--paper-radio-button-ink-size, -1px);
  }

  :host(:focus) {
    outline: none;
  }

  #radioContainer {
    @apply --layout-inline;
    @apply --layout-center-center;
    position: relative;
    width: var(--calculated-paper-radio-button-size);
    height: var(--calculated-paper-radio-button-size);
    vertical-align: middle;

    @apply --paper-radio-button-radio-container;
  }

  #ink {
    position: absolute;
    top: 50%;
    left: 50%;
    right: auto;
    width: var(--calculated-paper-radio-button-ink-size);
    height: var(--calculated-paper-radio-button-ink-size);
    color: var(--paper-radio-button-unchecked-ink-color, var(--primary-text-color));
    opacity: 0.6;
    pointer-events: none;
    -webkit-transform: translate(-50%, -50%);
    transform: translate(-50%, -50%);
  }

  #ink[checked] {
    color: var(--paper-radio-button-checked-ink-color, var(--primary-color));
  }

  #offRadio, #onRadio {
    position: absolute;
    box-sizing: border-box;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    border-radius: 50%;
  }

  #offRadio {
    border: 2px solid var(--paper-radio-button-unchecked-color, var(--primary-text-color));
    background-color: var(--paper-radio-button-unchecked-background-color, transparent);
    transition: border-color 0.28s;
  }

  #onRadio {
    background-color: var(--paper-radio-button-checked-color, var(--primary-color));
    -webkit-transform: scale(0);
    transform: scale(0);
    transition: -webkit-transform ease 0.28s;
    transition: transform ease 0.28s;
    will-change: transform;
  }

  :host([checked]) #offRadio {
    border-color: var(--paper-radio-button-checked-color, var(--primary-color));
  }

  :host([checked]) #onRadio {
    -webkit-transform: scale(0.5);
    transform: scale(0.5);
  }

  #radioLabel {
    line-height: normal;
    position: relative;
    display: inline-block;
    vertical-align: middle;
    margin-left: var(--paper-radio-button-label-spacing, 10px);
    white-space: normal;
    color: var(--paper-radio-button-label-color, var(--primary-text-color));

    @apply --paper-radio-button-label;
  }

  :host([checked]) #radioLabel {
    @apply --paper-radio-button-label-checked;
  }

  #radioLabel:dir(rtl) {
    margin-left: 0;
    margin-right: var(--paper-radio-button-label-spacing, 10px);
  }

  #radioLabel[hidden] {
    display: none;
  }

  /* disabled state */

  :host([disabled]) #offRadio {
    border-color: var(--paper-radio-button-unchecked-color, var(--primary-text-color));
    opacity: 0.5;
  }

  :host([disabled][checked]) #onRadio {
    background-color: var(--paper-radio-button-unchecked-color, var(--primary-text-color));
    opacity: 0.5;
  }

  :host([disabled]) #radioLabel {
    /* slightly darker than the button, so that it's readable */
    opacity: 0.65;
  }
</style>

<div id="radioContainer">
  <div id="offRadio"></div>
  <div id="onRadio"></div>
</div>

<div id="radioLabel"><slot></slot></div>`;
template$6.setAttribute('strip-whitespace', ''); /**
                                                 Material design: [Radio button](https://www.google.com/design/spec/components/selection-controls.html#selection-controls-radio-button)
                                                                                               `paper-radio-button` is a button that can be either checked or unchecked. The
                                                 user can tap the radio button to check or uncheck it.
                                                                                               Use a `<paper-radio-group>` to group a set of radio buttons. When radio buttons
                                                 are inside a radio group, exactly one radio button in the group can be checked
                                                 at any time.
                                                                                               Example:
                                                                                                   <paper-radio-button></paper-radio-button>
                                                   <paper-radio-button>Item label</paper-radio-button>
                                                                                               ### Styling
                                                                                               The following custom properties and mixins are available for styling:
                                                                                               Custom property | Description | Default
                                                 ----------------|-------------|----------
                                                 `--paper-radio-button-unchecked-background-color` | Radio button background color when the input is not checked | `transparent`
                                                 `--paper-radio-button-unchecked-color` | Radio button color when the input is not checked | `--primary-text-color`
                                                 `--paper-radio-button-unchecked-ink-color` | Selected/focus ripple color when the input is not checked | `--primary-text-color`
                                                 `--paper-radio-button-checked-color` | Radio button color when the input is checked | `--primary-color`
                                                 `--paper-radio-button-checked-ink-color` | Selected/focus ripple color when the input is checked | `--primary-color`
                                                 `--paper-radio-button-size` | Size of the radio button | `16px`
                                                 `--paper-radio-button-ink-size` | Size of the ripple | `48px`
                                                 `--paper-radio-button-label-color` | Label color | `--primary-text-color`
                                                 `--paper-radio-button-label-spacing` | Spacing between the label and the button | `10px`
                                                 `--paper-radio-button-radio-container` | A mixin applied to the internal radio container | `{}`
                                                 `--paper-radio-button-label` | A mixin applied to the internal label | `{}`
                                                 `--paper-radio-button-label-checked` | A mixin applied to the internal label when the radio button is checked | `{}`
                                                                                               This element applies the mixin `--paper-font-common-base` but does not import
                                                 `paper-styles/typography.html`. In order to apply the `Roboto` font to this
                                                 element, make sure you've imported `paper-styles/typography.html`.
                                                                                               @group Paper Elements
                                                 @element paper-radio-button
                                                 @demo demo/index.html
                                                 */
Polymer({
  _template: template$6,
  is: 'paper-radio-button',
  behaviors: [PaperCheckedElementBehavior],
  hostAttributes: {
    role: 'radio',
    'aria-checked': false,
    tabindex: 0
  },
  properties: {
    /**
     * Fired when the checked state changes due to user interaction.
     *
     * @event change
     */ /**
         * Fired when the checked state changes.
         *
         * @event iron-change
         */ariaActiveAttribute: {
      type: String,
      value: 'aria-checked'
    }
  },
  ready: function () {
    this._rippleContainer = this.$.radioContainer;
  },
  attached: function () {
    // Wait until styles have resolved to check for the default sentinel.
    // See polymer#4009 for more details.
    afterNextRender(this, function () {
      var inkSize = this.getComputedStyleValue('--calculated-paper-radio-button-ink-size').trim(); // If unset, compute and set the default `--paper-radio-button-ink-size`.

      if (inkSize === '-1px') {
        var size = parseFloat(this.getComputedStyleValue('--calculated-paper-radio-button-size').trim());
        var defaultInkSize = Math.floor(3 * size); // The button and ripple need to have the same parity so that their
        // centers align.

        if (defaultInkSize % 2 !== size % 2) {
          defaultInkSize++;
        }

        this.updateStyles({
          '--paper-radio-button-ink-size': defaultInkSize + 'px'
        });
      }
    });
  }
}); /// BareSpecifier=@polymer\paper-radio-group\paper-radio-group

Polymer({
  _template: html`
    <style>
      :host {
        display: inline-block;
      }

      :host ::slotted(*) {
        padding: var(--paper-radio-group-item-padding, 12px);
      }
    </style>

    <slot></slot>
`,
  is: 'paper-radio-group',
  behaviors: [IronMenubarBehavior],
  /** @private */hostAttributes: {
    role: 'radiogroup'
  },
  properties: {
    /**
     * Fired when the radio group selection changes.
     *
     * @event paper-radio-group-changed
     */ /**
         * Overriden from Polymer.IronSelectableBehavior
         */attrForSelected: {
      type: String,
      value: 'name'
    },
    /**
     * Overriden from Polymer.IronSelectableBehavior
     */selectedAttribute: {
      type: String,
      value: 'checked'
    },
    /**
     * Overriden from Polymer.IronSelectableBehavior
     */selectable: {
      type: String,
      value: 'paper-radio-button'
    },
    /**
     * If true, radio-buttons can be deselected
     */allowEmptySelection: {
      type: Boolean,
      value: false
    }
  },
  /**
   * Selects the given value.
   */select: function (value) {
    var newItem = this._valueToItem(value);

    if (newItem && newItem.hasAttribute('disabled')) {
      return;
    }

    if (this.selected) {
      var oldItem = this._valueToItem(this.selected);

      if (this.selected == value) {
        // If deselecting is allowed we'll have to apply an empty selection.
        // Otherwise, we should force the selection to stay and make this
        // action a no-op.
        if (this.allowEmptySelection) {
          value = '';
        } else {
          if (oldItem) oldItem.checked = true;
          return;
        }
      }

      if (oldItem) oldItem.checked = false;
    }

    IronSelectableBehavior.select.apply(this, [value]);
    this.fire('paper-radio-group-changed');
  },
  _activateFocusedItem: function () {
    this._itemActivate(this._valueForItem(this.focusedItem), this.focusedItem);
  },
  _onUpKey: function (event) {
    this._focusPrevious();

    event.preventDefault();

    this._activateFocusedItem();
  },
  _onDownKey: function (event) {
    this._focusNext();

    event.preventDefault();

    this._activateFocusedItem();
  },
  _onLeftKey: function (event) {
    IronMenubarBehaviorImpl._onLeftKey.apply(this, arguments);

    this._activateFocusedItem();
  },
  _onRightKey: function (event) {
    IronMenubarBehaviorImpl._onRightKey.apply(this, arguments);

    this._activateFocusedItem();
  }
}); /// BareSpecifier=@polymer\paper-spinner\paper-spinner-behavior

const PaperSpinnerBehavior = {
  properties: {
    /**
     * Displays the spinner.
     */active: {
      type: Boolean,
      value: false,
      reflectToAttribute: true,
      observer: '__activeChanged'
    },
    /**
     * Alternative text content for accessibility support.
     * If alt is present, it will add an aria-label whose content matches alt
     * when active. If alt is not present, it will default to 'loading' as the
     * alt value.
     */alt: {
      type: String,
      value: 'loading',
      observer: '__altChanged'
    },
    __coolingDown: {
      type: Boolean,
      value: false
    }
  },
  __computeContainerClasses: function (active, coolingDown) {
    return [active || coolingDown ? 'active' : '', coolingDown ? 'cooldown' : ''].join(' ');
  },
  __activeChanged: function (active, old) {
    this.__setAriaHidden(!active);

    this.__coolingDown = !active && old;
  },
  __altChanged: function (alt) {
    // user-provided `aria-label` takes precedence over prototype default
    if (alt === 'loading') {
      this.alt = this.getAttribute('aria-label') || alt;
    } else {
      this.__setAriaHidden(alt === '');

      this.setAttribute('aria-label', alt);
    }
  },
  __setAriaHidden: function (hidden) {
    var attr = 'aria-hidden';

    if (hidden) {
      this.setAttribute(attr, 'true');
    } else {
      this.removeAttribute(attr);
    }
  },
  __reset: function () {
    this.active = false;
    this.__coolingDown = false;
  }
};
var paperSpinnerBehavior = {
  PaperSpinnerBehavior: PaperSpinnerBehavior
}; /// BareSpecifier=@polymer\paper-spinner\paper-spinner-styles
/**
@license
Copyright (c) 2015 The Polymer Project Authors. All rights reserved.
This code may only be used under the BSD style license found at
http://polymer.github.io/LICENSE.txt The complete set of authors may be found at
http://polymer.github.io/AUTHORS.txt The complete set of contributors may be
found at http://polymer.github.io/CONTRIBUTORS.txt Code distributed by Google as
part of the polymer project is also subject to an additional IP rights grant
found at http://polymer.github.io/PATENTS.txt
*/
const $_documentContainer$4 = document.createElement('template');
$_documentContainer$4.setAttribute('style', 'display: none;');
$_documentContainer$4.innerHTML = `<dom-module id="paper-spinner-styles">
  <template>
    <style>
      /*
      /**************************/
      /* STYLES FOR THE SPINNER */
      /**************************/

      /*
       * Constants:
       *      ARCSIZE     = 270 degrees (amount of circle the arc takes up)
       *      ARCTIME     = 1333ms (time it takes to expand and contract arc)
       *      ARCSTARTROT = 216 degrees (how much the start location of the arc
       *                                should rotate each time, 216 gives us a
       *                                5 pointed star shape (it's 360/5 * 3).
       *                                For a 7 pointed star, we might do
       *                                360/7 * 3 = 154.286)
       *      SHRINK_TIME = 400ms
       */

      :host {
        display: inline-block;
        position: relative;
        width: 28px;
        height: 28px;

        /* 360 * ARCTIME / (ARCSTARTROT + (360-ARCSIZE)) */
        --paper-spinner-container-rotation-duration: 1568ms;

        /* ARCTIME */
        --paper-spinner-expand-contract-duration: 1333ms;

        /* 4 * ARCTIME */
        --paper-spinner-full-cycle-duration: 5332ms;

        /* SHRINK_TIME */
        --paper-spinner-cooldown-duration: 400ms;
      }

      #spinnerContainer {
        width: 100%;
        height: 100%;

        /* The spinner does not have any contents that would have to be
         * flipped if the direction changes. Always use ltr so that the
         * style works out correctly in both cases. */
        direction: ltr;
      }

      #spinnerContainer.active {
        -webkit-animation: container-rotate var(--paper-spinner-container-rotation-duration) linear infinite;
        animation: container-rotate var(--paper-spinner-container-rotation-duration) linear infinite;
      }

      @-webkit-keyframes container-rotate {
        to { -webkit-transform: rotate(360deg) }
      }

      @keyframes container-rotate {
        to { transform: rotate(360deg) }
      }

      .spinner-layer {
        position: absolute;
        width: 100%;
        height: 100%;
        opacity: 0;
        white-space: nowrap;
        color: var(--paper-spinner-color, var(--google-blue-500));
      }

      .layer-1 {
        color: var(--paper-spinner-layer-1-color, var(--google-blue-500));
      }

      .layer-2 {
        color: var(--paper-spinner-layer-2-color, var(--google-red-500));
      }

      .layer-3 {
        color: var(--paper-spinner-layer-3-color, var(--google-yellow-500));
      }

      .layer-4 {
        color: var(--paper-spinner-layer-4-color, var(--google-green-500));
      }

      /**
       * IMPORTANT NOTE ABOUT CSS ANIMATION PROPERTIES (keanulee):
       *
       * iOS Safari (tested on iOS 8.1) does not handle animation-delay very well - it doesn't
       * guarantee that the animation will start _exactly_ after that value. So we avoid using
       * animation-delay and instead set custom keyframes for each color (as layer-2undant as it
       * seems).
       */
      .active .spinner-layer {
        -webkit-animation-name: fill-unfill-rotate;
        -webkit-animation-duration: var(--paper-spinner-full-cycle-duration);
        -webkit-animation-timing-function: cubic-bezier(0.4, 0.0, 0.2, 1);
        -webkit-animation-iteration-count: infinite;
        animation-name: fill-unfill-rotate;
        animation-duration: var(--paper-spinner-full-cycle-duration);
        animation-timing-function: cubic-bezier(0.4, 0.0, 0.2, 1);
        animation-iteration-count: infinite;
        opacity: 1;
      }

      .active .spinner-layer.layer-1 {
        -webkit-animation-name: fill-unfill-rotate, layer-1-fade-in-out;
        animation-name: fill-unfill-rotate, layer-1-fade-in-out;
      }

      .active .spinner-layer.layer-2 {
        -webkit-animation-name: fill-unfill-rotate, layer-2-fade-in-out;
        animation-name: fill-unfill-rotate, layer-2-fade-in-out;
      }

      .active .spinner-layer.layer-3 {
        -webkit-animation-name: fill-unfill-rotate, layer-3-fade-in-out;
        animation-name: fill-unfill-rotate, layer-3-fade-in-out;
      }

      .active .spinner-layer.layer-4 {
        -webkit-animation-name: fill-unfill-rotate, layer-4-fade-in-out;
        animation-name: fill-unfill-rotate, layer-4-fade-in-out;
      }

      @-webkit-keyframes fill-unfill-rotate {
        12.5% { -webkit-transform: rotate(135deg) } /* 0.5 * ARCSIZE */
        25%   { -webkit-transform: rotate(270deg) } /* 1   * ARCSIZE */
        37.5% { -webkit-transform: rotate(405deg) } /* 1.5 * ARCSIZE */
        50%   { -webkit-transform: rotate(540deg) } /* 2   * ARCSIZE */
        62.5% { -webkit-transform: rotate(675deg) } /* 2.5 * ARCSIZE */
        75%   { -webkit-transform: rotate(810deg) } /* 3   * ARCSIZE */
        87.5% { -webkit-transform: rotate(945deg) } /* 3.5 * ARCSIZE */
        to    { -webkit-transform: rotate(1080deg) } /* 4   * ARCSIZE */
      }

      @keyframes fill-unfill-rotate {
        12.5% { transform: rotate(135deg) } /* 0.5 * ARCSIZE */
        25%   { transform: rotate(270deg) } /* 1   * ARCSIZE */
        37.5% { transform: rotate(405deg) } /* 1.5 * ARCSIZE */
        50%   { transform: rotate(540deg) } /* 2   * ARCSIZE */
        62.5% { transform: rotate(675deg) } /* 2.5 * ARCSIZE */
        75%   { transform: rotate(810deg) } /* 3   * ARCSIZE */
        87.5% { transform: rotate(945deg) } /* 3.5 * ARCSIZE */
        to    { transform: rotate(1080deg) } /* 4   * ARCSIZE */
      }

      @-webkit-keyframes layer-1-fade-in-out {
        0% { opacity: 1 }
        25% { opacity: 1 }
        26% { opacity: 0 }
        89% { opacity: 0 }
        90% { opacity: 1 }
        to { opacity: 1 }
      }

      @keyframes layer-1-fade-in-out {
        0% { opacity: 1 }
        25% { opacity: 1 }
        26% { opacity: 0 }
        89% { opacity: 0 }
        90% { opacity: 1 }
        to { opacity: 1 }
      }

      @-webkit-keyframes layer-2-fade-in-out {
        0% { opacity: 0 }
        15% { opacity: 0 }
        25% { opacity: 1 }
        50% { opacity: 1 }
        51% { opacity: 0 }
        to { opacity: 0 }
      }

      @keyframes layer-2-fade-in-out {
        0% { opacity: 0 }
        15% { opacity: 0 }
        25% { opacity: 1 }
        50% { opacity: 1 }
        51% { opacity: 0 }
        to { opacity: 0 }
      }

      @-webkit-keyframes layer-3-fade-in-out {
        0% { opacity: 0 }
        40% { opacity: 0 }
        50% { opacity: 1 }
        75% { opacity: 1 }
        76% { opacity: 0 }
        to { opacity: 0 }
      }

      @keyframes layer-3-fade-in-out {
        0% { opacity: 0 }
        40% { opacity: 0 }
        50% { opacity: 1 }
        75% { opacity: 1 }
        76% { opacity: 0 }
        to { opacity: 0 }
      }

      @-webkit-keyframes layer-4-fade-in-out {
        0% { opacity: 0 }
        65% { opacity: 0 }
        75% { opacity: 1 }
        90% { opacity: 1 }
        to { opacity: 0 }
      }

      @keyframes layer-4-fade-in-out {
        0% { opacity: 0 }
        65% { opacity: 0 }
        75% { opacity: 1 }
        90% { opacity: 1 }
        to { opacity: 0 }
      }

      .circle-clipper {
        display: inline-block;
        position: relative;
        width: 50%;
        height: 100%;
        overflow: hidden;
      }

      /**
       * Patch the gap that appear between the two adjacent div.circle-clipper while the
       * spinner is rotating (appears on Chrome 50, Safari 9.1.1, and Edge).
       */
      .spinner-layer::after {
        left: 45%;
        width: 10%;
        border-top-style: solid;
      }

      .spinner-layer::after,
      .circle-clipper::after {
        content: '';
        box-sizing: border-box;
        position: absolute;
        top: 0;
        border-width: var(--paper-spinner-stroke-width, 3px);
        border-radius: 50%;
      }

      .circle-clipper::after {
        bottom: 0;
        width: 200%;
        border-style: solid;
        border-bottom-color: transparent !important;
      }

      .circle-clipper.left::after {
        left: 0;
        border-right-color: transparent !important;
        -webkit-transform: rotate(129deg);
        transform: rotate(129deg);
      }

      .circle-clipper.right::after {
        left: -100%;
        border-left-color: transparent !important;
        -webkit-transform: rotate(-129deg);
        transform: rotate(-129deg);
      }

      .active .gap-patch::after,
      .active .circle-clipper::after {
        -webkit-animation-duration: var(--paper-spinner-expand-contract-duration);
        -webkit-animation-timing-function: cubic-bezier(0.4, 0.0, 0.2, 1);
        -webkit-animation-iteration-count: infinite;
        animation-duration: var(--paper-spinner-expand-contract-duration);
        animation-timing-function: cubic-bezier(0.4, 0.0, 0.2, 1);
        animation-iteration-count: infinite;
      }

      .active .circle-clipper.left::after {
        -webkit-animation-name: left-spin;
        animation-name: left-spin;
      }

      .active .circle-clipper.right::after {
        -webkit-animation-name: right-spin;
        animation-name: right-spin;
      }

      @-webkit-keyframes left-spin {
        0% { -webkit-transform: rotate(130deg) }
        50% { -webkit-transform: rotate(-5deg) }
        to { -webkit-transform: rotate(130deg) }
      }

      @keyframes left-spin {
        0% { transform: rotate(130deg) }
        50% { transform: rotate(-5deg) }
        to { transform: rotate(130deg) }
      }

      @-webkit-keyframes right-spin {
        0% { -webkit-transform: rotate(-130deg) }
        50% { -webkit-transform: rotate(5deg) }
        to { -webkit-transform: rotate(-130deg) }
      }

      @keyframes right-spin {
        0% { transform: rotate(-130deg) }
        50% { transform: rotate(5deg) }
        to { transform: rotate(-130deg) }
      }

      #spinnerContainer.cooldown {
        -webkit-animation: container-rotate var(--paper-spinner-container-rotation-duration) linear infinite, fade-out var(--paper-spinner-cooldown-duration) cubic-bezier(0.4, 0.0, 0.2, 1);
        animation: container-rotate var(--paper-spinner-container-rotation-duration) linear infinite, fade-out var(--paper-spinner-cooldown-duration) cubic-bezier(0.4, 0.0, 0.2, 1);
      }

      @-webkit-keyframes fade-out {
        0% { opacity: 1 }
        to { opacity: 0 }
      }

      @keyframes fade-out {
        0% { opacity: 1 }
        to { opacity: 0 }
      }
    </style>
  </template>
</dom-module>`;
document.head.appendChild($_documentContainer$4.content); /// BareSpecifier=@polymer\paper-spinner\paper-spinner

const template$7 = html`
  <style include="paper-spinner-styles"></style>

  <div id="spinnerContainer" class-name="[[__computeContainerClasses(active, __coolingDown)]]" on-animationend="__reset" on-webkit-animation-end="__reset">
    <div class="spinner-layer layer-1">
      <div class="circle-clipper left"></div>
      <div class="circle-clipper right"></div>
    </div>

    <div class="spinner-layer layer-2">
      <div class="circle-clipper left"></div>
      <div class="circle-clipper right"></div>
    </div>

    <div class="spinner-layer layer-3">
      <div class="circle-clipper left"></div>
      <div class="circle-clipper right"></div>
    </div>

    <div class="spinner-layer layer-4">
      <div class="circle-clipper left"></div>
      <div class="circle-clipper right"></div>
    </div>
  </div>
`;
template$7.setAttribute('strip-whitespace', ''); /**
                                                 Material design: [Progress &
                                                 activity](https://www.google.com/design/spec/components/progress-activity.html)
                                                                                               Element providing a multiple color material design circular spinner.
                                                                                                   <paper-spinner active></paper-spinner>
                                                                                               The default spinner cycles between four layers of colors; by default they are
                                                 blue, red, yellow and green. It can be customized to cycle between four
                                                 different colors. Use <paper-spinner-lite> for single color spinners.
                                                                                               ### Accessibility
                                                                                               Alt attribute should be set to provide adequate context for accessibility. If
                                                 not provided, it defaults to 'loading'. Empty alt can be provided to mark the
                                                 element as decorative if alternative content is provided in another form (e.g. a
                                                 text block following the spinner).
                                                                                                   <paper-spinner alt="Loading contacts list" active></paper-spinner>
                                                                                               ### Styling
                                                                                               The following custom properties and mixins are available for styling:
                                                                                               Custom property | Description | Default
                                                 ----------------|-------------|----------
                                                 `--paper-spinner-layer-1-color` | Color of the first spinner rotation | `--google-blue-500`
                                                 `--paper-spinner-layer-2-color` | Color of the second spinner rotation | `--google-red-500`
                                                 `--paper-spinner-layer-3-color` | Color of the third spinner rotation | `--google-yellow-500`
                                                 `--paper-spinner-layer-4-color` | Color of the fourth spinner rotation | `--google-green-500`
                                                 `--paper-spinner-stroke-width` | The width of the spinner stroke | 3px
                                                                                               @group Paper Elements
                                                 @element paper-spinner
                                                 @hero hero.svg
                                                 @demo demo/index.html
                                                 */
Polymer({
  _template: template$7,
  is: 'paper-spinner',
  behaviors: [PaperSpinnerBehavior]
}); /// BareSpecifier=@polymer\paper-swatch-picker\paper-swatch-picker-icon

const template$8 = html`
<iron-iconset-svg size="24" name="swatch">
<svg><defs>
<g id="format-color-fill"><path d="M16.56 8.94L7.62 0 6.21 1.41l2.38 2.38-5.15 5.15c-.59.59-.59 1.54 0 2.12l5.5 5.5c.29.29.68.44 1.06.44s.77-.15 1.06-.44l5.5-5.5c.59-.58.59-1.53 0-2.12zM5.21 10L10 5.21 14.79 10H5.21zM19 11.5s-2 2.17-2 3.5c0 1.1.9 2 2 2s2-.9 2-2c0-1.33-2-3.5-2-3.5z"></path><path fill-opacity=".36" d="M0 20h24v4H0z"></path></g>
</defs></svg>
</iron-iconset-svg>
`;
template$8.setAttribute('style', 'display: none;');
document.head.appendChild(template$8.content); /// BareSpecifier=@polymer\paper-swatch-picker\paper-swatch-picker

Polymer({
  _template: html`
    <style>
      :host {
        display: inline-block;
        position: relative;
      }

      :host(:focus) {
        outline: none;
      }

      .color {
        box-sizing: border-box;
        width: var(--paper-swatch-picker-color-size, 20px);
        height: var(--paper-swatch-picker-color-size, 20px);
        display: inline-block;
        padding: 0;
        margin: 0;
        cursor: pointer;
        font-size: 0;
        position: relative;
      }

      /* If we just scale the paper-item when hovering, this will end up
       * adding scrollbars to the paper-listbox that are hard to get rid of.
       * An easy workaround is to use an :after pseudo element instead. */
      .color:after {
        @apply --layout-fit;
        background: currentColor;
        content: '';
        -webkit-transition: -webkit-transform 0.2s;
        transition: transform .2s;
        z-index: 0;
      }

      .color:hover:after, .color:focus:after {
        -webkit-transform: scale(1.3, 1.3);
        transform: scale(1.3, 1.3);
        outline: none;
        z-index: 1;
      }

      paper-icon-button {
        @apply --paper-swatch-picker-icon;
      }

      paper-item {
        margin: 0;
        padding: 0;
        min-height: 0;

        --paper-item-focused-before: {
          opacity: 0;
        };
      }

      paper-listbox {
        padding: 0;
        font-size: 0;
        overflow: hidden;
        @apply --layout-vertical;
        @apply --layout-wrap;
      }
    </style>

    <paper-menu-button vertical-align="[[verticalAlign]]" horizontal-align="[[horizontalAlign]]">
      <paper-icon-button id="iconButton" icon="[[icon]]" slot="dropdown-trigger" class="dropdown-trigger" alt="color picker" noink\$="[[noink]]">
      </paper-icon-button>
      <paper-listbox slot="dropdown-content" class="dropdown-content" id="container">
        <template is="dom-repeat" items="[[colorList]]">
          <paper-item class="color">[[item]]</paper-item>
        </template>
      </paper-listbox>
    </paper-menu-button>
`,
  is: 'paper-swatch-picker',
  hostAttributes: {
    'tabindex': 0
  },
  listeners: {
    'paper-dropdown-open': '_onOpen',
    'iron-select': '_onColorTap'
  },
  /**
   * Fired when a color has been selected
   *
   * @event color-picker-selected
   */properties: {
    /**
     * The selected color, as hex (i.e. #ffffff).
     * value.
     */color: {
      type: String,
      notify: true,
      observer: '_colorChanged'
    },
    /**
     * The colors to be displayed. By default, these are the Material Design
     * colors. This array is arranged by "generic color", so for example,
     * all the reds (from light to dark), then the pinks, then the blues, etc.
     * Depending on how many of these generic colors you have, you should
     * update the `columnCount` property.
     */colorList: {
      type: Array,
      value: function () {
        return this.defaultColors();
      },
      observer: '_colorListChanged'
    },
    /* The number of columns to display in the picker. This corresponds to
     * the number of generic colors (i.e. not counting the light/dark) variants
     * of a specific color) you are using in your `colorList`. For example,
     * the Material Design palette has 18 colors */columnCount: {
      type: Number,
      value: 18,
      observer: '_columnCountChanged'
    },
    /**
     * The orientation against which to align the menu dropdown
     * horizontally relative to the dropdown trigger.
     */horizontalAlign: {
      type: String,
      value: 'left',
      reflectToAttribute: true
    },
    /**
     * The orientation against which to align the menu dropdown
     * vertically relative to the dropdown trigger.
     */verticalAlign: {
      type: String,
      value: 'top',
      reflectToAttribute: true
    },
    /**
     * The name of the icon to use for the button used as a dropdown trigger.
     * The name should be of the form: `iconset_name:icon_name`.
     * You must manually import the icon/iconset you wish you use.
     */icon: {
      type: String,
      value: 'swatch:format-color-fill'
    },
    /**
     * If true, the color picker button will not produce a ripple effect when
     * interacted with via the pointer.
     */noink: {
      type: Boolean
    }
  },
  attached: function () {
    // Note: we won't actually render these color boxes unless the menu is
    // actually tapped.
    this._renderedColors = false;

    this._updateSize();
  },
  /**
   * Returns the default Material Design colors.
   *
   * @return {Array[string]}
   */defaultColors: function () {
    return ['#ffebee', '#ffcdd2', '#ef9a9a', '#e57373', '#ef5350', '#f44336', '#e53935', '#d32f2f', '#c62828', '#b71c1c', '#fce4ec', '#f8bbd0', '#f48fb1', '#f06292', '#ec407a', '#e91e63', '#d81b60', '#c2185b', '#ad1457', '#880e4f', '#f3e5f5', '#e1bee7', '#ce93d8', '#ba68c8', '#ab47bc', '#9c27b0', '#8e24aa', '#7b1fa2', '#6a1b9a', '#4a148c', '#ede7f6', '#d1c4e9', '#b39ddb', '#9575cd', '#7e57c2', '#673ab7', '#5e35b1', '#512da8', '#4527a0', '#311b92', '#e8eaf6', '#c5cae9', '#9fa8da', '#7986cb', '#5c6bc0', '#3f51b5', '#3949ab', '#303f9f', '#283593', '#1a237e', '#e3f2fd', '#bbdefb', '#90caf9', '#64b5f6', '#42a5f5', '#2196f3', '#1e88e5', '#1976d2', '#1565c0', '#0d47a1', '#e1f5fe', '#b3e5fc', '#81d4fa', '#4fc3f7', '#29b6f6', '#03a9f4', '#039be5', '#0288d1', '#0277bd', '#01579b', '#e0f7fa', '#b2ebf2', '#80deea', '#4dd0e1', '#26c6da', '#00bcd4', '#00acc1', '#0097a7', '#00838f', '#006064', '#e0f2f1', '#b2dfdb', '#80cbc4', '#4db6ac', '#26a69a', '#009688', '#00897b', '#00796b', '#00695c', '#004d40', '#e8f5e9', '#c8e6c9', '#a5d6a7', '#81c784', '#66bb6a', '#4caf50', '#43a047', '#388e3c', '#2e7d32', '#1b5e20', '#f1f8e9', '#dcedc8', '#c5e1a5', '#aed581', '#9ccc65', '#8bc34a', '#7cb342', '#689f38', '#558b2f', '#33691e', '#f9fbe7', '#f0f4c3', '#e6ee9c', '#dce775', '#d4e157', '#cddc39', '#c0ca33', '#afb42b', '#9e9d24', '#827717', '#fffde7', '#fff9c4', '#fff59d', '#fff176', '#ffee58', '#ffeb3b', '#fdd835', '#fbc02d', '#f9a825', '#f57f17', '#fff8e1', '#ffecb3', '#ffe082', '#ffd54f', '#ffca28', '#ffc107', '#ffb300', '#ffa000', '#ff8f00', '#ff6f00', '#fff3e0', '#ffe0b2', '#ffcc80', '#ffb74d', '#ffa726', '#ff9800', '#fb8c00', '#f57c00', '#ef6c00', '#e65100', '#fbe9e7', '#ffccbc', '#ffab91', '#ff8a65', '#ff7043', '#ff5722', '#f4511e', '#e64a19', '#d84315', '#bf360c', '#efebe9', '#d7ccc8', '#bcaaa4', '#a1887f', '#8d6e63', '#795548', '#6d4c41', '#5d4037', '#4e342e', '#3e2723', '#fafafa', '#f5f5f5', '#eeeeee', '#e0e0e0', '#bdbdbd', '#9e9e9e', '#757575', '#616161', '#424242', '#212121'];
  },
  _onOpen: function () {
    // Fill in the colors if we haven't already.
    if (this._renderedColors) return;
    var colorBoxes = this.$.container.querySelectorAll('.color');

    for (var i = 0; i < colorBoxes.length; i++) {
      colorBoxes[i].style.color = colorBoxes[i].innerHTML;
    }

    this._renderedColors = true;
  },
  _addOverflowClass: function () {
    this.$.container.toggleClass('opened', true);
  },
  _removeOverflowClass: function () {
    this.$.container.toggleClass('opened', false);
  },
  _onColorTap: function (event) {
    var item = event.detail.item; // The inner `span` element has the background color;

    var color = item.style.color; // If it's in rgb format, convert it first.

    this.color = color.indexOf('rgb') === -1 ? color : this._rgbToHex(color);
    this.fire('color-picker-selected', {
      color: this.color
    });
  },
  _colorChanged: function () {
    this.$.iconButton.style.color = this.color;
  },
  _colorListChanged: function () {
    // Fall back to the first color, if the new color list doesn't contain the
    // selected color. Bad news: the color could be either toLowerCase or
    // uppercase so uhhh try both.
    if (this.color && this.color !== '' && this.colorList.indexOf(this.color) === -1 && this.colorList.indexOf(String(this.color).toLowerCase()) === -1) {
      this.color = this.colorList[0];
    }

    this._updateSize();
  },
  _columnCountChanged: function () {
    this._updateSize();
  },
  /**
   * Takes an rgb(r, g, b) style string and converts it to a #ffffff hex value.
   */_rgbToHex: function (rgb) {
    // Split the rgb(r, g, b) string up.
    var split = rgb.split('(')[1].split(')')[0].split(',');
    if (split.length != 3) return ''; // From https://gist.github.com/lrvick/2080648.

    var bin = split[0] << 16 | split[1] << 8 | split[2];
    return function (h) {
      return '#' + new Array(7 - h.length).join('0') + h;
    }(bin.toString(16).toLowerCase());
  },
  _updateSize: function () {
    // Fit the color boxes in columns. We first need to get the width of
    // a color box (which is customizable), and then change the box's
    // width to fit all the columns.
    var sizeOfAColorDiv = this.getComputedStyleValue('--paper-swatch-picker-color-size');

    if (!sizeOfAColorDiv || sizeOfAColorDiv == '') {
      // Default value case
      sizeOfAColorDiv = 20;
    } else {
      sizeOfAColorDiv = sizeOfAColorDiv.replace('px', '');
    }

    var rowCount = Math.ceil(this.colorList.length / this.columnCount);
    this.$.container.style.height = rowCount * sizeOfAColorDiv + 'px';
    this.$.container.style.width = this.columnCount * sizeOfAColorDiv + 'px';
    this._renderedColors = false;
  }
}); /// BareSpecifier=@polymer\paper-toast\paper-toast

var currentToast = null; /**
                         Material design: [Snackbars &
                         toasts](https://www.google.com/design/spec/components/snackbars-toasts.html)
                         
                         `paper-toast` provides a subtle notification toast. Only one `paper-toast` will
                         be visible on screen.
                         
                         Use `opened` to show the toast:
                         
                         Example:
                         
                             <paper-toast text="Hello world!" opened></paper-toast>
                         
                         Also `open()` or `show()` can be used to show the toast:
                         
                         Example:
                         
                             <paper-button on-click="openToast">Open Toast</paper-button>
                             <paper-toast id="toast" text="Hello world!"></paper-toast>
                         
                             ...
                         
                             openToast: function() {
                               this.$.toast.open();
                             }
                         
                         Set `duration` to 0, a negative number or Infinity to persist the toast on
                         screen:
                         
                         Example:
                         
                             <paper-toast text="Terms and conditions" opened duration="0">
                               <a href="#">Show more</a>
                             </paper-toast>
                         
                         
                         ### Styling
                         The following custom properties and mixins are available for styling:
                         
                         Custom property | Description | Default
                         ----------------|-------------|----------
                         `--paper-toast-background-color` | The paper-toast background-color | `#323232`
                         `--paper-toast-color` | The paper-toast color | `#f1f1f1`
                         
                         This element applies the mixin `--paper-font-common-base` but does not import
                         `paper-styles/typography.html`. In order to apply the `Roboto` font to this
                         element, make sure you've imported `paper-styles/typography.html`.
                         
                         @group Paper Elements
                         @element paper-toast
                         @demo demo/index.html
                         @hero hero.svg
                         */
Polymer({
  _template: html`
    <style>
      :host {
        display: block;
        position: fixed;
        background-color: var(--paper-toast-background-color, #323232);
        color: var(--paper-toast-color, #f1f1f1);
        min-height: 48px;
        min-width: 288px;
        padding: 16px 24px;
        box-sizing: border-box;
        box-shadow: 0 2px 5px 0 rgba(0, 0, 0, 0.26);
        border-radius: 2px;
        margin: 12px;
        font-size: 14px;
        cursor: default;
        -webkit-transition: -webkit-transform 0.3s, opacity 0.3s;
        transition: transform 0.3s, opacity 0.3s;
        opacity: 0;
        -webkit-transform: translateY(100px);
        transform: translateY(100px);
        @apply --paper-font-common-base;
      }

      :host(.capsule) {
        border-radius: 24px;
      }

      :host(.fit-bottom) {
        width: 100%;
        min-width: 0;
        border-radius: 0;
        margin: 0;
      }

      :host(.paper-toast-open) {
        opacity: 1;
        -webkit-transform: translateY(0px);
        transform: translateY(0px);
      }
    </style>

    <span id="label">{{text}}</span>
    <slot></slot>
`,
  is: 'paper-toast',
  behaviors: [IronOverlayBehavior],
  properties: {
    /**
     * The element to fit `this` into.
     * Overridden from `Polymer.IronFitBehavior`.
     */fitInto: {
      type: Object,
      value: window,
      observer: '_onFitIntoChanged'
    },
    /**
     * The orientation against which to align the dropdown content
     * horizontally relative to `positionTarget`.
     * Overridden from `Polymer.IronFitBehavior`.
     */horizontalAlign: {
      type: String,
      value: 'left'
    },
    /**
     * The orientation against which to align the dropdown content
     * vertically relative to `positionTarget`.
     * Overridden from `Polymer.IronFitBehavior`.
     */verticalAlign: {
      type: String,
      value: 'bottom'
    },
    /**
     * The duration in milliseconds to show the toast.
     * Set to `0`, a negative number, or `Infinity`, to disable the
     * toast auto-closing.
     */duration: {
      type: Number,
      value: 3000
    },
    /**
     * The text to display in the toast.
     */text: {
      type: String,
      value: ''
    },
    /**
     * Overridden from `IronOverlayBehavior`.
     * Set to false to enable closing of the toast by clicking outside it.
     */noCancelOnOutsideClick: {
      type: Boolean,
      value: true
    },
    /**
     * Overridden from `IronOverlayBehavior`.
     * Set to true to disable auto-focusing the toast or child nodes with
     * the `autofocus` attribute` when the overlay is opened.
     */noAutoFocus: {
      type: Boolean,
      value: true
    }
  },
  listeners: {
    'transitionend': '__onTransitionEnd'
  },

  /**
   * Read-only. Deprecated. Use `opened` from `IronOverlayBehavior`.
   * @property visible
   * @deprecated
   */get visible() {
    Base._warn('`visible` is deprecated, use `opened` instead');

    return this.opened;
  },

  /**
   * Read-only. Can auto-close if duration is a positive finite number.
   * @property _canAutoClose
   */get _canAutoClose() {
    return this.duration > 0 && this.duration !== Infinity;
  },

  created: function () {
    this._autoClose = null;
    IronA11yAnnouncer.requestAvailability();
  },
  /**
   * Show the toast. Without arguments, this is the same as `open()` from
   * `IronOverlayBehavior`.
   * @param {(Object|string)=} properties Properties to be set before opening the toast.
   * e.g. `toast.show('hello')` or `toast.show({text: 'hello', duration: 3000})`
   */show: function (properties) {
    if (typeof properties == 'string') {
      properties = {
        text: properties
      };
    }

    for (var property in properties) {
      if (property.indexOf('_') === 0) {
        Base._warn('The property "' + property + '" is private and was not set.');
      } else if (property in this) {
        this[property] = properties[property];
      } else {
        Base._warn('The property "' + property + '" is not valid.');
      }
    }

    this.open();
  },
  /**
   * Hide the toast. Same as `close()` from `IronOverlayBehavior`.
   */hide: function () {
    this.close();
  },
  /**
   * Called on transitions of the toast, indicating a finished animation
   * @private
   */__onTransitionEnd: function (e) {
    // there are different transitions that are happening when opening and
    // closing the toast. The last one so far is for `opacity`.
    // This marks the end of the transition, so we check for this to determine
    // if this is the correct event.
    if (e && e.target === this && e.propertyName === 'opacity') {
      if (this.opened) {
        this._finishRenderOpened();
      } else {
        this._finishRenderClosed();
      }
    }
  },
  /**
   * Overridden from `IronOverlayBehavior`.
   * Called when the value of `opened` changes.
   */_openedChanged: function () {
    if (this._autoClose !== null) {
      this.cancelAsync(this._autoClose);
      this._autoClose = null;
    }

    if (this.opened) {
      if (currentToast && currentToast !== this) {
        currentToast.close();
      }

      currentToast = this;
      this.fire('iron-announce', {
        text: this.text
      });

      if (this._canAutoClose) {
        this._autoClose = this.async(this.close, this.duration);
      }
    } else if (currentToast === this) {
      currentToast = null;
    }

    IronOverlayBehaviorImpl._openedChanged.apply(this, arguments);
  },
  /**
   * Overridden from `IronOverlayBehavior`.
   */_renderOpened: function () {
    this.classList.add('paper-toast-open');
  },
  /**
   * Overridden from `IronOverlayBehavior`.
   */_renderClosed: function () {
    this.classList.remove('paper-toast-open');
  },
  /**
   * @private
   */_onFitIntoChanged: function (fitInto) {
    this.positionTarget = fitInto;
  } /**
     * Fired when `paper-toast` is opened.
     *
     * @event 'iron-announce'
     * @param {{text: string}} detail Contains text that will be announced.
     */
}); /// BareSpecifier=@polymer\paper-tooltip\paper-tooltip

Polymer({
  _template: html`
    <style>
      :host {
        display: block;
        position: absolute;
        outline: none;
        z-index: 1002;
        -moz-user-select: none;
        -ms-user-select: none;
        -webkit-user-select: none;
        user-select: none;
        cursor: default;
      }

      #tooltip {
        display: block;
        outline: none;
        @apply --paper-font-common-base;
        font-size: 10px;
        line-height: 1;
        background-color: var(--paper-tooltip-background, #616161);
        color: var(--paper-tooltip-text-color, white);
        padding: 8px;
        border-radius: 2px;
        @apply --paper-tooltip;
      }

      @keyframes keyFrameScaleUp {
        0% {
          transform: scale(0.0);
        }
        100% {
          transform: scale(1.0);
        }
      }

      @keyframes keyFrameScaleDown {
        0% {
          transform: scale(1.0);
        }
        100% {
          transform: scale(0.0);
        }
      }

      @keyframes keyFrameFadeInOpacity {
        0% {
          opacity: 0;
        }
        100% {
          opacity: var(--paper-tooltip-opacity, 0.9);
        }
      }

      @keyframes keyFrameFadeOutOpacity {
        0% {
          opacity: var(--paper-tooltip-opacity, 0.9);
        }
        100% {
          opacity: 0;
        }
      }

      @keyframes keyFrameSlideDownIn {
        0% {
          transform: translateY(-2000px);
          opacity: 0;
        }
        10% {
          opacity: 0.2;
        }
        100% {
          transform: translateY(0);
          opacity: var(--paper-tooltip-opacity, 0.9);
        }
      }

      @keyframes keyFrameSlideDownOut {
        0% {
          transform: translateY(0);
          opacity: var(--paper-tooltip-opacity, 0.9);
        }
        10% {
          opacity: 0.2;
        }
        100% {
          transform: translateY(-2000px);
          opacity: 0;
        }
      }

      .fade-in-animation {
        opacity: 0;
        animation-delay: var(--paper-tooltip-delay-in, 500ms);
        animation-name: keyFrameFadeInOpacity;
        animation-iteration-count: 1;
        animation-timing-function: ease-in;
        animation-duration: var(--paper-tooltip-duration-in, 500ms);
        animation-fill-mode: forwards;
        @apply --paper-tooltip-animation;
      }

      .fade-out-animation {
        opacity: var(--paper-tooltip-opacity, 0.9);
        animation-delay: var(--paper-tooltip-delay-out, 0ms);
        animation-name: keyFrameFadeOutOpacity;
        animation-iteration-count: 1;
        animation-timing-function: ease-in;
        animation-duration: var(--paper-tooltip-duration-out, 500ms);
        animation-fill-mode: forwards;
        @apply --paper-tooltip-animation;
      }

      .scale-up-animation {
        transform: scale(0);
        opacity: var(--paper-tooltip-opacity, 0.9);
        animation-delay: var(--paper-tooltip-delay-in, 500ms);
        animation-name: keyFrameScaleUp;
        animation-iteration-count: 1;
        animation-timing-function: ease-in;
        animation-duration: var(--paper-tooltip-duration-in, 500ms);
        animation-fill-mode: forwards;
        @apply --paper-tooltip-animation;
      }

      .scale-down-animation {
        transform: scale(1);
        opacity: var(--paper-tooltip-opacity, 0.9);
        animation-delay: var(--paper-tooltip-delay-out, 500ms);
        animation-name: keyFrameScaleDown;
        animation-iteration-count: 1;
        animation-timing-function: ease-in;
        animation-duration: var(--paper-tooltip-duration-out, 500ms);
        animation-fill-mode: forwards;
        @apply --paper-tooltip-animation;
      }

      .slide-down-animation {
        transform: translateY(-2000px);
        opacity: 0;
        animation-delay: var(--paper-tooltip-delay-out, 500ms);
        animation-name: keyFrameSlideDownIn;
        animation-iteration-count: 1;
        animation-timing-function: cubic-bezier(0.0, 0.0, 0.2, 1);
        animation-duration: var(--paper-tooltip-duration-out, 500ms);
        animation-fill-mode: forwards;
        @apply --paper-tooltip-animation;
      }

      .slide-down-animation-out {
        transform: translateY(0);
        opacity: var(--paper-tooltip-opacity, 0.9);
        animation-delay: var(--paper-tooltip-delay-out, 500ms);
        animation-name: keyFrameSlideDownOut;
        animation-iteration-count: 1;
        animation-timing-function: cubic-bezier(0.4, 0.0, 1, 1);
        animation-duration: var(--paper-tooltip-duration-out, 500ms);
        animation-fill-mode: forwards;
        @apply --paper-tooltip-animation;
      }

      .cancel-animation {
        animation-delay: -30s !important;
      }

      /* Thanks IE 10. */

      .hidden {
        display: none !important;
      }
    </style>

    <div id="tooltip" class="hidden">
      <slot></slot>
    </div>
`,
  is: 'paper-tooltip',
  hostAttributes: {
    role: 'tooltip',
    tabindex: -1
  },
  properties: {
    /**
     * The id of the element that the tooltip is anchored to. This element
     * must be a sibling of the tooltip. If this property is not set,
     * then the tooltip will be centered to the parent node containing it.
     */for: {
      type: String,
      observer: '_findTarget'
    },
    /**
     * Set this to true if you want to manually control when the tooltip
     * is shown or hidden.
     */manualMode: {
      type: Boolean,
      value: false,
      observer: '_manualModeChanged'
    },
    /**
     * Positions the tooltip to the top, right, bottom, left of its content.
     */position: {
      type: String,
      value: 'bottom'
    },
    /**
     * If true, no parts of the tooltip will ever be shown offscreen.
     */fitToVisibleBounds: {
      type: Boolean,
      value: false
    },
    /**
     * The spacing between the top of the tooltip and the element it is
     * anchored to.
     */offset: {
      type: Number,
      value: 14
    },
    /**
     * This property is deprecated, but left over so that it doesn't
     * break exiting code. Please use `offset` instead. If both `offset` and
     * `marginTop` are provided, `marginTop` will be ignored.
     * @deprecated since version 1.0.3
     */marginTop: {
      type: Number,
      value: 14
    },
    /**
     * The delay that will be applied before the `entry` animation is
     * played when showing the tooltip.
     */animationDelay: {
      type: Number,
      value: 500,
      observer: '_delayChange'
    },
    /**
     * The animation that will be played on entry.  This replaces the
     * deprecated animationConfig.  Entries here will override the
     * animationConfig settings.  You can enter your own animation
     * by setting it to the css class name.
     */animationEntry: {
      type: String,
      value: ''
    },
    /**
     * The animation that will be played on exit.  This replaces the
     * deprecated animationConfig.  Entries here will override the
     * animationConfig settings.  You can enter your own animation
     * by setting it to the css class name.
     */animationExit: {
      type: String,
      value: ''
    },
    /**
     * This property is deprecated.  Use --paper-tooltip-animation to change the
     * animation. The entry and exit animations that will be played when showing
     * and hiding the tooltip. If you want to override this, you must ensure
     * that your animationConfig has the exact format below.
     * @deprecated since version
     *
     * The entry and exit animations that will be played when showing and
     * hiding the tooltip. If you want to override this, you must ensure
     * that your animationConfig has the exact format below.
     */animationConfig: {
      type: Object,
      value: function () {
        return {
          'entry': [{
            name: 'fade-in-animation',
            node: this,
            timing: {
              delay: 0
            }
          }],
          'exit': [{
            name: 'fade-out-animation',
            node: this
          }]
        };
      }
    },
    _showing: {
      type: Boolean,
      value: false
    }
  },
  listeners: {
    'webkitAnimationEnd': '_onAnimationEnd'
  },

  /**
   * Returns the target element that this tooltip is anchored to. It is
   * either the element given by the `for` attribute, or the immediate parent
   * of the tooltip.
   *
   * @type {Node}
   */get target() {
    var parentNode = dom(this).parentNode; // If the parentNode is a document fragment, then we need to use the host.

    var ownerRoot = dom(this).getOwnerRoot();
    var target;

    if (this.for) {
      target = dom(ownerRoot).querySelector('#' + this.for);
    } else {
      target = parentNode.nodeType == Node.DOCUMENT_FRAGMENT_NODE ? ownerRoot.host : parentNode;
    }

    return target;
  },

  /**
   * @return {void}
   */attached: function () {
    this._findTarget();
  },
  /**
   * @return {void}
   */detached: function () {
    if (!this.manualMode) this._removeListeners();
  },
  /**
   * Replaces Neon-Animation playAnimation - just calls show and hide.
   * @deprecated Use show and hide instead.
   * @param {string} type Either `entry` or `exit`
   */playAnimation: function (type) {
    if (type === 'entry') {
      this.show();
    } else if (type === 'exit') {
      this.hide();
    }
  },
  /**
   * Cancels the animation and either fully shows or fully hides tooltip
   */cancelAnimation: function () {
    // Short-cut and cancel all animations and hide
    this.$.tooltip.classList.add('cancel-animation');
  },
  /**
   * Shows the tooltip programatically
   * @return {void}
   */show: function () {
    // If the tooltip is already showing, there's nothing to do.
    if (this._showing) return;

    if (dom(this).textContent.trim() === '') {
      // Check if effective children are also empty
      var allChildrenEmpty = true;
      var effectiveChildren = dom(this).getEffectiveChildNodes();

      for (var i = 0; i < effectiveChildren.length; i++) {
        if (effectiveChildren[i].textContent.trim() !== '') {
          allChildrenEmpty = false;
          break;
        }
      }

      if (allChildrenEmpty) {
        return;
      }
    }

    this._showing = true;
    this.$.tooltip.classList.remove('hidden');
    this.$.tooltip.classList.remove('cancel-animation');
    this.$.tooltip.classList.remove(this._getAnimationType('exit'));
    this.updatePosition();
    this._animationPlaying = true;
    this.$.tooltip.classList.add(this._getAnimationType('entry'));
  },
  /**
   * Hides the tooltip programatically
   * @return {void}
   */hide: function () {
    // If the tooltip is already hidden, there's nothing to do.
    if (!this._showing) {
      return;
    } // If the entry animation is still playing, don't try to play the exit
    // animation since this will reset the opacity to 1. Just end the animation.


    if (this._animationPlaying) {
      this._showing = false;

      this._cancelAnimation();

      return;
    } else {
      // Play Exit Animation
      this._onAnimationFinish();
    }

    this._showing = false;
    this._animationPlaying = true;
  },
  /**
   * @return {void}
   */updatePosition: function () {
    if (!this._target || !this.offsetParent) return;
    var offset = this.offset; // If a marginTop has been provided by the user (pre 1.0.3), use it.

    if (this.marginTop != 14 && this.offset == 14) offset = this.marginTop;
    var parentRect = this.offsetParent.getBoundingClientRect();

    var targetRect = this._target.getBoundingClientRect();

    var thisRect = this.getBoundingClientRect();
    var horizontalCenterOffset = (targetRect.width - thisRect.width) / 2;
    var verticalCenterOffset = (targetRect.height - thisRect.height) / 2;
    var targetLeft = targetRect.left - parentRect.left;
    var targetTop = targetRect.top - parentRect.top;
    var tooltipLeft, tooltipTop;

    switch (this.position) {
      case 'top':
        tooltipLeft = targetLeft + horizontalCenterOffset;
        tooltipTop = targetTop - thisRect.height - offset;
        break;

      case 'bottom':
        tooltipLeft = targetLeft + horizontalCenterOffset;
        tooltipTop = targetTop + targetRect.height + offset;
        break;

      case 'left':
        tooltipLeft = targetLeft - thisRect.width - offset;
        tooltipTop = targetTop + verticalCenterOffset;
        break;

      case 'right':
        tooltipLeft = targetLeft + targetRect.width + offset;
        tooltipTop = targetTop + verticalCenterOffset;
        break;
    } // TODO(noms): This should use IronFitBehavior if possible.


    if (this.fitToVisibleBounds) {
      // Clip the left/right side
      if (parentRect.left + tooltipLeft + thisRect.width > window.innerWidth) {
        this.style.right = '0px';
        this.style.left = 'auto';
      } else {
        this.style.left = Math.max(0, tooltipLeft) + 'px';
        this.style.right = 'auto';
      } // Clip the top/bottom side.


      if (parentRect.top + tooltipTop + thisRect.height > window.innerHeight) {
        this.style.bottom = parentRect.height - targetTop + offset + 'px';
        this.style.top = 'auto';
      } else {
        this.style.top = Math.max(-parentRect.top, tooltipTop) + 'px';
        this.style.bottom = 'auto';
      }
    } else {
      this.style.left = tooltipLeft + 'px';
      this.style.top = tooltipTop + 'px';
    }
  },
  _addListeners: function () {
    if (this._target) {
      this.listen(this._target, 'mouseenter', 'show');
      this.listen(this._target, 'focus', 'show');
      this.listen(this._target, 'mouseleave', 'hide');
      this.listen(this._target, 'blur', 'hide');
      this.listen(this._target, 'tap', 'hide');
    }

    this.listen(this.$.tooltip, 'animationend', '_onAnimationEnd');
    this.listen(this, 'mouseenter', 'hide');
  },
  _findTarget: function () {
    if (!this.manualMode) this._removeListeners();
    this._target = this.target;
    if (!this.manualMode) this._addListeners();
  },
  _delayChange: function (newValue) {
    // Only Update delay if different value set
    if (newValue !== 500) {
      this.updateStyles({
        '--paper-tooltip-delay-in': newValue + 'ms'
      });
    }
  },
  _manualModeChanged: function () {
    if (this.manualMode) this._removeListeners();else this._addListeners();
  },
  _cancelAnimation: function () {
    // Short-cut and cancel all animations and hide
    this.$.tooltip.classList.remove(this._getAnimationType('entry'));
    this.$.tooltip.classList.remove(this._getAnimationType('exit'));
    this.$.tooltip.classList.remove('cancel-animation');
    this.$.tooltip.classList.add('hidden');
  },
  _onAnimationFinish: function () {
    if (this._showing) {
      this.$.tooltip.classList.remove(this._getAnimationType('entry'));
      this.$.tooltip.classList.remove('cancel-animation');
      this.$.tooltip.classList.add(this._getAnimationType('exit'));
    }
  },
  _onAnimationEnd: function () {
    // If no longer showing add class hidden to completely hide tooltip
    this._animationPlaying = false;

    if (!this._showing) {
      this.$.tooltip.classList.remove(this._getAnimationType('exit'));
      this.$.tooltip.classList.add('hidden');
    }
  },
  _getAnimationType: function (type) {
    // These properties have priority over animationConfig values
    if (type === 'entry' && this.animationEntry !== '') {
      return this.animationEntry;
    }

    if (type === 'exit' && this.animationExit !== '') {
      return this.animationExit;
    } // If no results then return the legacy value from animationConfig


    if (this.animationConfig[type] && typeof this.animationConfig[type][0].name === 'string') {
      // Checking Timing and Update if necessary - Legacy for animationConfig
      if (this.animationConfig[type][0].timing && this.animationConfig[type][0].timing.delay && this.animationConfig[type][0].timing.delay !== 0) {
        var timingDelay = this.animationConfig[type][0].timing.delay; // Has Timing Change - Update CSS

        if (type === 'entry') {
          this.updateStyles({
            '--paper-tooltip-delay-in': timingDelay + 'ms'
          });
        } else if (type === 'exit') {
          this.updateStyles({
            '--paper-tooltip-delay-out': timingDelay + 'ms'
          });
        }
      }

      return this.animationConfig[type][0].name;
    }
  },
  _removeListeners: function () {
    if (this._target) {
      this.unlisten(this._target, 'mouseenter', 'show');
      this.unlisten(this._target, 'focus', 'show');
      this.unlisten(this._target, 'mouseleave', 'hide');
      this.unlisten(this._target, 'blur', 'hide');
      this.unlisten(this._target, 'tap', 'hide');
    }

    this.unlisten(this.$.tooltip, 'animationend', '_onAnimationEnd');
    this.unlisten(this, 'mouseenter', 'hide');
  }
});

class SocialMediaIcons extends PolymerElement {
  // Define publc API properties
  static get properties() {
    return {
      /**
      * The `icon` attribute grabs a vector-shaped logo of social media you choose
      *
      * @attribute icon
      * @type string
      * @default 'github'
      */icon: {
        type: String,
        value: 'github',
        notify: true,
        reflectToAttribute: true,
        observer: '_getPath'
      },
      /**
       * The `size` attribute sets a size of an element
       *
       * @attribute size
       * @type int
       * @default 32
       */size: {
        type: Number,
        value: 32,
        notify: true,
        reflectToAttribute: true
      },
      /**
       * The `color` attribute fills the shape with a color you choose
       *
       * @attribute color
       * @type hex
       * @default undefined
       */color: {
        type: String,
        notify: true,
        reflectToAttribute: true
      },
      /**
       * The `title` attribute changes the title
       *
       * @attribute change
       * @type string
       */title: {
        type: String,
        notify: true,
        reflectToAttribute: true
      }
    };
  }

  _getPath() {
    switch (this.icon) {
      case 'dribbble':
        this.path = 'M16,32C7.2,32,0,24.8,0,16C0,7.2,7.2,0,16,0c8.8,0,16,7.2,16,16C32,24.8,24.8,32,16,32L16,32z M29.5,18.2 C29,18,25.3,16.9,21,17.6c1.8,4.9,2.5,8.9,2.7,9.7C26.7,25.3,28.9,22,29.5,18.2L29.5,18.2z M21.3,28.6c-0.2-1.2-1-5.4-2.9-10.4 c0,0-0.1,0-0.1,0c-7.7,2.7-10.5,8-10.7,8.5c 2.3,1.8,5.2,2.9,8.4,2.9C17.9,29.7,19.7,29.3,21.3,28.6L21.3,28.6z M5.8,25.2 c0.3-0.5,4.1-6.7,11.1-9c0.2-0.1,0.4-0.1,0.5-0.2c-0.3-0.8-0.7-1.6-1.1-2.3c-6.8,2-13.4,2-14,1.9c0,0.1,0,0.3,0,0.4 C2.3,19.5,3.7,22.7,5.8,25.2L5.8,25.2z M2.6,13.2c0.6,0,6.2,0,12.6-1.7c-2.3-4-4.7-7.4-5.1-7.9C6.4,5.5,3.5,9,2.6,13.2L2.6,13.2z M12.8,2.7c0.4,0.5,2.9,3.9,5.1,8c4.9-1.8,6.9-4.6,7.2-4.9c-2.4-2.1-5.6-3.4-9.1-3.4C14.9,2.4,13.8,2.5,12.8,2.7L12.8,2.7z M26.6,7.4c-0.3,0.4-2.6,3.3-7.6,5.4c0.3,0.7,0.6,1.3,0.9,2c0.1,0.2,0.2,0.5,0.3,0.7c4.5-0.6,9.1,0.3,9.5,0.4 C29.6,12.7,28.5,9.7,26.6,7.4L26.6,7.4z';
        break;

      case 'facebook':
        this.path = 'M30.2,0H1.8C0.8,0,0,0.8,0,1.8v28.5c0,1,0.8,1.8,1.8,1.8h15.3V19.6h-4.2v-4.8h4.2v-3.6 c0-4.1,2.5-6.4,6.2-6.4C25.1,4.8,26.6,5,27,5v4.3l-2.6,0c-2,0-2.4,1-2.4,2.4v3.1h4.8l-0.6,4.8h-4.2V32h8.2c1,0,1.8-0.8,1.8-1.8V1.8 C32,0.8,31.2,0,30.2,0z';
        break;

      case 'github':
        this.path = 'M16,0.4c-8.8,0-16,7.2-16,16c0,7.1,4.6,13.1,10.9,15.2 c0.8,0.1,1.1-0.3,1.1-0.8c0-0.4,0-1.4,0-2.7c-4.5,1-5.4-2.1-5.4-2.1c-0.7-1.8-1.8-2.3-1.8-2.3c-1.5-1,0.1-1,0.1-1 c1.6,0.1,2.5,1.6,2.5,1.6c1.4,2.4,3.7,1.7,4.7,1.3c0.1-1,0.6-1.7,1-2.1c-3.6-0.4-7.3-1.8-7.3-7.9c0-1.7,0.6-3.2,1.6-4.3 c-0.2-0.4-0.7-2,0.2-4.2c0,0,1.3-0.4,4.4,1.6c1.3-0.4,2.6-0.5,4-0.5c1.4,0,2.7,0.2,4,0.5C23.1,6.6,24.4,7,24.4,7 c0.9,2.2,0.3,3.8,0.2,4.2c1,1.1,1.6,2.5,1.6,4.3c0,6.1-3.7,7.5-7.3,7.9c0.6,0.5,1.1,1.5,1.1,3c0,2.1,0,3.9,0,4.4 c0,0.4,0.3,0.9,1.1,0.8C27.4,29.5,32,23.5,32,16.4C32,7.6,24.8,0.4,16,0.4z';
        break;

      case 'googleplus':
        this.path = 'M32,14.7h-3.3v-3.3H26v3.3h-3.3v2.7H26v3.3h2.7v-3.3H32 M10.7,14v4.2h5.8c-0.4,2.5-2.6,4.3-5.8,4.3c-3.5,0-6.4-3-6.4-6.5 s2.9-6.5,6.4-6.5c1.6,0,3,0.5,4.1,1.6v0l3-3c-1.8-1.7-4.3-2.8-7.1-2.8C4.8,5.3,0,10.1,0,16s4.8,10.7,10.7,10.7 c6.2,0,10.2-4.3,10.2-10.4c0-0.8-0.1-1.5-0.2-2.2C20.7,14,10.7,14,10.7,14z';
        break;

      case 'instagram':
        this.path = 'M28.2,0H3.8C1.7,0,0,1.7,0,3.8v24.4C0,30.3,1.7,32,3.8,32h24.4c2.1,0,3.8-1.7,3.8-3.8V3.8 C32,1.7,30.3,0,28.2,0z M22.2,4.5c0-0.5,0.4-0.9,0.9-0.9h4.3c0.5,0,0.9,0.4,0.9,0.9v4.3c0,0.5-0.4,0.9-0.9,0.9h-4.3 c-0.5,0-0.9-0.4-0.9-0.9V4.5z M16,9.9c3.4,0,6.2,2.7,6.2,6.1c0,3.4-2.8,6.1-6.2,6.1c-3.4,0-6.2-2.7-6.2-6.1 C9.9,12.6,12.6,9.9,16,9.9z M28.4,27.4c0,0.5-0.4,0.9-0.9,0.9h-23c-0.5,0-0.9-0.4-0.9-0.9V13.5h3c-0.2,0.8-0.3,1.7-0.3,2.6 c0,5.4,4.4,9.7,9.7,9.7c5.4,0,9.7-4.4,9.7-9.7c0-0.9-0.1-1.7-0.3-2.6h3V27.4z';
        break;

      case 'lastfm':
        this.path = 'M14.1,22.9l-1.2-3.2c0,0-1.9,2.1-4.8,2.1c-2.5,0-4.3-2.2-4.3-5.7c0-4.5,2.3-6.1,4.5-6.1 c3.2,0,4.3,2.1,5.1,4.8l1.2,3.7c1.2,3.6,3.4,6.4,9.7,6.4c4.5,0,7.6-1.4,7.6-5.1c0-3-1.7-4.5-4.8-5.2l-2.3-0.5 c-1.6-0.4-2.1-1-2.1-2.1c0-1.2,1-2,2.6-2c1.8,0,2.7,0.7,2.9,2.2l3.7-0.4c-0.3-3.3-2.6-4.7-6.3-4.7c-3.3,0-6.5,1.2-6.5,5.2 c0,2.5,1.2,4.1,4.3,4.8l2.5,0.6c1.9,0.4,2.5,1.2,2.5,2.3c0,1.4-1.3,1.9-3.8,1.9c-3.7,0-5.2-1.9-6.1-4.6l-1.2-3.7 c-1.5-4.8-4-6.5-8.9-6.5C2.9,7.1,0,10.5,0,16.3c0,5.6,2.9,8.6,8,8.6C12.1,24.9,14.1,22.9,14.1,22.9L14.1,22.9z';
        break;

      case 'linkedin':
        this.path = 'M29.6,0H2.4C1.1,0,0,1,0,2.3v27.4C0,31,1.1,32,2.4,32h27.3c1.3,0,2.4-1,2.4-2.3V2.3C32,1,30.9,0,29.6,0z M9.5,27.3H4.7V12h4.7V27.3z M7.1,9.9c-1.5,0-2.8-1.2-2.8-2.8c0-1.5,1.2-2.8,2.8-2.8c1.5,0,2.8,1.2,2.8,2.8 C9.9,8.7,8.6,9.9,7.1,9.9z M27.3,27.3h-4.7v-7.4c0-1.8,0-4-2.5-4c-2.5,0-2.8,1.9-2.8,3.9v7.6h-4.7V12H17v2.1h0.1 c0.6-1.2,2.2-2.5,4.5-2.5c4.8,0,5.7,3.2,5.7,7.3V27.3z';
        break;

      case 'medium':
        this.path = 'M32,7.1h-1.3c-0.5,0-1.1,0.7-1.1,1.1v15.7c0,0.4,0.7,1,1.1,1H32v3.7H20.5v-3.7h2.4V8.4h-0.1l-5.6,20.3h-4.3 L7.3,8.4H7.2v16.5h2.4v3.7H0v-3.7h1.2c0.5,0,1.2-0.6,1.2-1V8.2c0-0.4-0.7-1.1-1.2-1.1H0V3.3h12L15.9,18h0.1l4-14.7h12V7.1z';
        break;

      case 'quora':
        this.path = 'M23.2,26.6C23.2,26.6,23.2,26.5,23.2,26.6c4-2.5,6.7-7,6.7-12.4C29.9,3.7,23.1,0,16,0 C9.4,0,2.1,5.2,2.1,14.3c0,10.4,6.8,14.3,13.8,14.3c1.1,0,2.2-0.1,3.2-0.4c0,0,0,0,0,0c2.8,5,6.9,3.8,8,3.4c0,0-0.1-0.9-0.4-2.5 C24.8,29,23.9,28,23.2,26.6z M17.8,24.9c-0.6,0.2-1.3,0.2-1.9,0.2c-3.3,0-7.2-1.4-7.2-10.3c0-8.9,4.1-11.3,7.4-11.3 c3.3,0,7.1,2.1,7.1,11c0,4-0.8,6.6-2,8.2c0,0,0,0,0,0c-2.7-3.5-6.3-2.7-7.1-2.3c0,0,0.1,0.8,0.3,2.3 C16.3,22.6,17.2,23.6,17.8,24.9C17.8,24.8,17.8,24.9,17.8,24.9z';
        break;

      case 'pinterest':
        this.path = 'M16,0C7.2,0,0,7.2,0,16c0,6.8,4.2,12.6,10.2,14.9c-0.1-1.3-0.3-3.2,0.1-4.6c0.3-1.2,1.9-8,1.9-8 s-0.5-1-0.5-2.4c0-2.2,1.3-3.9,2.9-3.9c1.4,0,2,1,2,2.3c0,1.4-0.9,3.4-1.3,5.3c-0.4,1.6,0.8,2.9,2.4,2.9c2.8,0,5-3,5-7.3 c0-3.8-2.8-6.5-6.7-6.5c-4.6,0-7.2,3.4-7.2,6.9c0,1.4,0.5,2.8,1.2,3.7c0.1,0.2,0.1,0.3,0.1,0.5c-0.1,0.5-0.4,1.6-0.4,1.8 C9.5,21.9,9.3,22,9,21.8c-2-0.9-3.2-3.9-3.2-6.2c0-5,3.7-9.7,10.6-9.7c5.6,0,9.9,4,9.9,9.2c0,5.5-3.5,10-8.3,10 c-1.6,0-3.1-0.8-3.7-1.8c0,0-0.8,3.1-1,3.8c-0.4,1.4-1.3,3.1-2,4.2c1.5,0.5,3.1,0.7,4.7,0.7c8.8,0,16-7.2,16-16 C32,7.2,24.8,0,16,0z';
        break;

      case 'skype':
        this.path = 'M30.9,18.7c0.2-0.9,0.3-1.8,0.3-2.7c0-2-0.4-4-1.2-5.9c-0.8-1.8-1.8-3.4-3.2-4.8c-1.4-1.4-3-2.5-4.8-3.2 C20,1.2,18,0.8,16,0.8c-1,0-1.9,0.1-2.9,0.3c0,0,0,0,0,0c-1.3-0.7-2.7-1-4.2-1C6.6,0,4.3,1,2.6,2.7C0.9,4.3,0,6.6,0,9 c0,1.5,0.4,3,1.1,4.3c-0.1,0.9-0.2,1.7-0.2,2.6c0,2,0.4,4,1.2,5.9c0.8,1.8,1.8,3.4,3.2,4.8c1.4,1.4,3,2.5,4.8,3.2 C12,30.6,14,31,16,31c0.9,0,1.8-0.1,2.6-0.2c1.3,0.8,2.9,1.2,4.4,1.2c2.4,0,4.6-0.9,6.3-2.6c1.7-1.7,2.6-3.9,2.6-6.3 C32,21.5,31.6,20,30.9,18.7z M16.1,25.2c-5.4,0-7.8-2.6-7.8-4.6c0-1,0.7-1.7,1.8-1.7c2.3,0,1.7,3.3,6,3.3c2.2,0,3.4-1.2,3.4-2.4 c0-0.7-0.4-1.5-1.8-1.9l-4.8-1.2c-3.8-1-4.5-3-4.5-5c0-4.1,3.8-5.6,7.4-5.6c3.3,0,7.2,1.8,7.2,4.3c0,1-0.9,1.6-1.9,1.6 c-2,0-1.6-2.7-5.5-2.7c-2,0-3,0.9-3,2.2c0,1.3,1.5,1.7,2.9,2l3.5,0.8c3.9,0.9,4.9,3.1,4.9,5.3C23.7,22.7,21.2,25.2,16.1,25.2z';
        break;

      case 'spotify':
        this.path = 'M16,0C7.2,0,0,7.2,0,16s7.2,16,16,16c8.8,0,16-7.2,16-16 S24.8,0,16,0z M13.7,8.4c4.7,0,9.6,1,13.3,3.1c0.5,0.3,0.8,0.7,0.8,1.5c0,0.9-0.7,1.5-1.5,1.5c-0.3,0-0.5-0.1-0.8-0.2 c-2.9-1.7-7.4-2.7-11.7-2.7c-2.2,0-4.4,0.2-6.4,0.8c-0.2,0.1-0.5,0.2-0.8,0.2c-0.9,0-1.5-0.7-1.5-1.5c0-0.9,0.5-1.4,1.1-1.5 C8.3,8.7,10.9,8.4,13.7,8.4z M13.3,13.8c4.2,0,8.2,1,11.4,2.9c0.5,0.3,0.7,0.7,0.7,1.3c0,0.7-0.6,1.3-1.2,1.3 c-0.3,0-0.6-0.1-0.8-0.3c-2.6-1.5-6.2-2.6-10.2-2.6c-2,0-3.8,0.3-5.2,0.7c-0.3,0.1-0.5,0.2-0.8,0.2c-0.7,0-1.2-0.6-1.2-1.3 c0-0.7,0.3-1.1,1-1.3C8.8,14.2,10.7,13.8,13.3,13.8z M13.5,19.1c3.5,0,6.6,0.8,9.3,2.4c0.4,0.2,0.6,0.5,0.6,1.1c0,0.6-0.5,1-1,1 c-0.3,0-0.4-0.1-0.7-0.2c-2.3-1.4-5.2-2.1-8.3-2.1c-1.7,0-3.4,0.2-5,0.6c-0.3,0.1-0.6,0.2-0.8,0.2c-0.6,0-1-0.5-1-1 c0-0.7,0.4-1,0.9-1.1C9.5,19.3,11.5,19.1,13.5,19.1z';
        break;

      case 'stumbleupon':
        this.path = 'M16,0C7.2,0,0,7.2,0,16c0,8.8,7.2,16,16,16c8.8,0,16-7.2,16-16C32,7.2,24.8,0,16,0z M15.8,12.1 c-0.5,0-1,0.4-1,1l0,5.8c0,2.2-1.8,4-4.1,4c-2.3,0-4.1-1.8-4.1-4.1c0,0,0-2.5,0-2.5h3.1v2.5c0,0.5,0.4,1,1,1s1-0.4,1-1v-5.9 c0.1-2.2,1.9-3.9,4.1-3.9c2.2,0,4,1.8,4.1,4v1.3L18,14.8l-1.3-0.6v-1.1C16.8,12.6,16.4,12.1,15.8,12.1z M25,18.9 c0,2.3-1.8,4.1-4.1,4.1c-2.2,0-4.1-1.8-4.1-4.1v-2.6l1.3,0.6l1.9-0.6V19c0,0.5,0.4,1,1,1s1-0.4,1-1v-2.6H25 C25,16.3,25,18.8,25,18.9z';
        break;

      case 'tumblr':
        this.path = 'M23.7,25.6c-0.6,0.3-1.7,0.5-2.6,0.6C18.5,26.2,18,24.3,18,23V13h6.4V8.2H18V0c0,0-4.6,0-4.7,0 c-0.1,0-0.2,0.1-0.2,0.2c-0.3,2.5-1.4,6.9-6.3,8.6V13H10v10.5c0,3.6,2.6,8.7,9.6,8.5c2.4,0,5-1,5.5-1.9L23.7,25.6z';
        break;

      case 'twitter':
        this.path = 'M32,6.1c-1.2,0.5-2.4,0.9-3.8,1c1.4-0.8,2.4-2.1,2.9-3.6c-1.3,0.8-2.7,1.3-4.2,1.6C25.7,3.8,24,3,22.2,3 c-3.6,0-6.6,2.9-6.6,6.6c0,0.5,0.1,1,0.2,1.5C10.3,10.8,5.5,8.2,2.2,4.2c-0.6,1-0.9,2.1-0.9,3.3c0,2.3,1.2,4.3,2.9,5.5 c-1.1,0-2.1-0.3-3-0.8c0,0,0,0.1,0,0.1c0,3.2,2.3,5.8,5.3,6.4c-0.6,0.1-1.1,0.2-1.7,0.2c-0.4,0-0.8,0-1.2-0.1 c0.8,2.6,3.3,4.5,6.1,4.6c-2.2,1.8-5.1,2.8-8.2,2.8c-0.5,0-1.1,0-1.6-0.1C2.9,27.9,6.4,29,10.1,29c12.1,0,18.7-10,18.7-18.7 c0-0.3,0-0.6,0-0.8C30,8.5,31.1,7.4,32,6.1z';
        break;

      case 'youtube':
        this.path = 'M31.7,9.6c0,0-0.3-2.2-1.3-3.2c-1.2-1.3-2.6-1.3-3.2-1.4C22.7,4.7,16,4.7,16,4.7h0c0,0-6.7,0-11.2,0.3 c-0.6,0.1-2,0.1-3.2,1.4c-1,1-1.3,3.2-1.3,3.2S0,12.2,0,14.8v2.4c0,2.6,0.3,5.2,0.3,5.2s0.3,2.2,1.3,3.2c1.2,1.3,2.8,1.2,3.5,1.4 C7.7,27.2,16,27.3,16,27.3s6.7,0,11.2-0.3c0.6-0.1,2-0.1,3.2-1.4c1-1,1.3-3.2,1.3-3.2s0.3-2.6,0.3-5.2v-2.4 C32,12.2,31.7,9.6,31.7,9.6z M12.7,20.2l0-9l8.6,4.5L12.7,20.2z';
        break;

      case 'vimeo':
        this.path = 'M32,8.5c-0.1,3.1-2.3,7.4-6.5,12.8c-4.4,5.7-8,8.5-11,8.5c-1.9,0-3.4-1.7-4.7-5.2c-0.9-3.2-1.7-6.3-2.6-9.5 c-1-3.4-2-5.2-3.1-5.2c-0.2,0-1.1,0.5-2.5,1.5L0,9.6c1.6-1.4,3.1-2.8,4.7-4.2c2.1-1.8,3.7-2.8,4.7-2.9c2.5-0.2,4,1.5,4.6,5.1 c0.6,3.9,1.1,6.4,1.3,7.3c0.7,3.3,1.5,4.9,2.4,4.9c0.7,0,1.7-1.1,3-3.2c1.3-2.1,2.1-3.7,2.2-4.8c0.2-1.8-0.5-2.7-2.2-2.7 c-0.8,0-1.6,0.2-2.4,0.5c1.6-5.2,4.6-7.7,9-7.5C30.6,2.2,32.2,4.4,32,8.5z';
        break;

      case 'vine':
        this.path = 'M30,15.9c-0.8,0.2-1.6,0.3-2.3,0.3c-4,0-7.1-2.8-7.1-7.7c0-2.4,0.9-3.7,2.2-3.7c1.3,0,2.1,1.1,2.1,3.4 c0,1.3-0.3,2.7-0.6,3.6c0,0,1.2,2.2,4.6,1.5c0.7-1.6,1.1-3.7,1.1-5.5C30,2.9,27.5,0,22.9,0c-4.7,0-7.5,3.6-7.5,8.4 c0,4.7,2.2,8.8,5.9,10.6c-1.5,3.1-3.5,5.8-5.5,7.8c-3.7-4.5-7-10.4-8.4-22H2c2.5,19.3,10,25.5,12,26.7c1.1,0.7,2.1,0.6,3.1,0.1 c1.6-0.9,6.4-5.7,9.1-11.4c1.1,0,2.5-0.1,3.8-0.4V15.9z';
        break;
    }
  } // Define the element's template


  static get template() {
    return html$1`
      <style>
        :host { display: inline-block; }
        :host:hover path {
            fill: var(--social-media-icons-hover-color);
        }
      </style>
      <svg id="svg" preserveAspectRatio="xMinYMin meet" style$="width:{{size}}px;height:{{size}}px" width$="{{size}}" height$="{{size}}" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" aria-labelledby="title" role="img">
      </svg>
    `;
  }

  ready() {
    super.ready(); // If `color` is not defined in Light DOM, fill the icon with brand color

    if (!this.color) {
      switch (this.icon) {
        case 'dribbble':
          this.color = '#EA4C89';
          break;

        case 'facebook':
          this.color = '#3B5998';
          break;

        case 'github':
          this.color = '#171515';
          break;

        case 'googleplus':
          this.color = '#DB4E3F';
          break;

        case 'instagram':
          this.color = '#3F729B';
          break;

        case 'jsfiddle':
          this.color = '#4679BD';
          break;

        case 'lastfm':
          this.color = '#D51007';
          break;

        case 'linkedin':
          this.color = '#0077B5';
          break;

        case 'medium':
          this.color = '#231F20';
          break;

        case 'quora':
          this.color = '#A72723';
          break;

        case 'pinterest':
          this.color = '#CB2027';
          break;

        case 'skype':
          this.color = '#00AFF0';
          break;

        case 'spotify':
          this.color = '#6AE368';
          break;

        case 'stumbleupon':
          this.color = '#EF4E23';
          break;

        case 'tumblr':
          this.color = '#35465C';
          break;

        case 'twitter':
          this.color = '#55ACEE';
          break;

        case 'youtube':
          this.color = '#E52D27';
          break;

        case 'vimeo':
          this.color = '#1AB7EA';
          break;

        case 'vine':
          this.color = '#00B489';
          break;

        default:
          this.color = '#000000';
          break;
      }
    }

    var svg = this.$.svg;
    var path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('fill', this.color);
    path.setAttribute('d', this.path);
    svg.appendChild(path);
  }

} // Register the element with the browser


customElements.define('social-media-icons', SocialMediaIcons); //<link rel="import" href="bower_components/web-animations-js/web-animations-next.dev.html">

function loadScript(url, callback) {
  var script = document.createElement("script");

  if (script.readyState) {
    //IE
    script.onreadystatechange = function () {
      if (script.readyState == "loaded" || script.readyState == "complete") {
        script.onreadystatechange = null;
        callback();
      }
    };
  } else {
    //Others
    script.onload = function () {
      if (callback) {
        callback();
      }
    };
  }

  script.src = url;
  script.async = false;
  document.getElementsByTagName("head")[0].appendChild(script);
}

loadScript("./node_modules/web-animations-js/src/dev.js");
loadScript("./node_modules/web-animations-js/src/scope.js");
loadScript("./node_modules/web-animations-js/src/timing-utilities.js");
loadScript("./node_modules/web-animations-js/src/normalize-keyframes.js");
loadScript("./node_modules/web-animations-js/src/deprecation.js");
loadScript("./node_modules/web-animations-js/src/keyframe-interpolations.js");
loadScript("./node_modules/web-animations-js/src/property-interpolation.js");
loadScript("./node_modules/web-animations-js/src/keyframe-effect.js");
loadScript("./node_modules/web-animations-js/src/apply-preserving-inline-style.js");
loadScript("./node_modules/web-animations-js/src/element-animatable.js");
loadScript("./node_modules/web-animations-js/src/interpolation.js");
loadScript("./node_modules/web-animations-js/src/matrix-interpolation.js");
loadScript("./node_modules/web-animations-js/src/animation.js");
loadScript("./node_modules/web-animations-js/src/tick.js");
loadScript("./node_modules/web-animations-js/src/matrix-decomposition.js");
loadScript("./node_modules/web-animations-js/src/handler-utils.js");
loadScript("./node_modules/web-animations-js/src/shadow-handler.js");
loadScript("./node_modules/web-animations-js/src/number-handler.js");
loadScript("./node_modules/web-animations-js/src/visibility-handler.js");
loadScript("./node_modules/web-animations-js/src/color-handler.js");
loadScript("./node_modules/web-animations-js/src/dimension-handler.js");
loadScript("./node_modules/web-animations-js/src/box-handler.js");
loadScript("./node_modules/web-animations-js/src/transform-handler.js");
loadScript("./node_modules/web-animations-js/src/font-weight-handler.js");
loadScript("./node_modules/web-animations-js/src/position-handler.js");
loadScript("./node_modules/web-animations-js/src/shape-handler.js");
loadScript("./node_modules/web-animations-js/src/property-names.js");
loadScript("./node_modules/web-animations-js/src/web-animations-bonus-cancel-events.js");
loadScript("./node_modules/web-animations-js/src/web-animations-bonus-object-form-keyframes.js");
loadScript("./node_modules/web-animations-js/src/web-animations-next-animation.js");
loadScript("./node_modules/web-animations-js/src/timeline.js");
loadScript("./node_modules/web-animations-js/src/keyframe-effect-constructor.js");
loadScript("./node_modules/web-animations-js/src/effect-callback.js");
loadScript("./node_modules/web-animations-js/src/group-constructors.js");
export { ironA11yAnnouncer as $ironA11yAnnouncer, ironCheckedElementBehavior as $ironCheckedElementBehavior, ironFitBehavior as $ironFitBehavior, ironFormElementBehavior as $ironFormElementBehavior, ironMenuBehavior as $ironMenuBehavior, ironMenubarBehavior as $ironMenubarBehavior, ironFocusablesHelper as $ironFocusablesHelper, ironOverlayBehavior as $ironOverlayBehavior, ironOverlayManager as $ironOverlayManager, ironScrollManager as $ironScrollManager, ironRangeBehavior as $ironRangeBehavior, ironMultiSelectable as $ironMultiSelectable, ironSelectable as $ironSelectable, ironSelection as $ironSelection, ironValidatableBehavior as $ironValidatableBehavior, neonAnimatableBehavior as $neonAnimatableBehavior, neonAnimationBehavior as $neonAnimationBehavior, neonAnimationRunnerBehavior as $neonAnimationRunnerBehavior, paperCheckedElementBehavior as $paperCheckedElementBehavior, paperDialogBehavior as $paperDialogBehavior, paperInputAddonBehavior as $paperInputAddonBehavior, paperInputBehavior as $paperInputBehavior, paperItemBehavior as $paperItemBehavior, paperMenuButton as $paperMenuButton, paperSpinnerBehavior as $paperSpinnerBehavior, IronA11yAnnouncer, IronCheckedElementBehaviorImpl, IronCheckedElementBehavior, IronFitBehavior, IronFormElementBehavior, IronMenuBehaviorImpl, IronMenuBehavior, IronMenubarBehaviorImpl, IronMenubarBehavior, IronFocusablesHelper, IronOverlayBehaviorImpl, IronOverlayBehavior, IronOverlayManagerClass, IronOverlayManager, currentLockingElement, elementIsScrollLocked, pushScrollLock, removeScrollLock, _lockingElements, _lockedElementCache, _unlockedElementCache, _hasCachedLockedElement, _hasCachedUnlockedElement, _composedTreeContains, _scrollInteractionHandler, _boundScrollHandler, _lockScrollInteractions, _unlockScrollInteractions, _shouldPreventScrolling, _getScrollableNodes, _getScrollingNode, _getScrollInfo, IronRangeBehavior, IronMultiSelectableBehaviorImpl, IronMultiSelectableBehavior, IronSelectableBehavior, IronSelection, IronValidatableBehaviorMeta, IronValidatableBehavior, NeonAnimatableBehavior, NeonAnimationBehavior, NeonAnimationRunnerBehaviorImpl, NeonAnimationRunnerBehavior, PaperCheckedElementBehaviorImpl, PaperCheckedElementBehavior, PaperDialogBehaviorImpl, PaperDialogBehavior, PaperInputAddonBehavior, PaperInputHelper, PaperInputBehaviorImpl, PaperInputBehavior, PaperItemBehaviorImpl, PaperItemBehavior, PaperMenuButton, PaperSpinnerBehavior };