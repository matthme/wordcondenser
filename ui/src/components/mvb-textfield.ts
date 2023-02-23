import { LitElement, html, css } from 'lit';
import { state, customElement, property, query } from 'lit/decorators.js';
import { sharedStyles } from '../sharedStyles';




@customElement('mvb-textfield')
export class MVBTextField extends LitElement {

  @property() placeholder: string = "";

  @property() required: boolean = false;

  @state()
  value: string = "";

  @query("#input-field")
  inputField!: HTMLInputElement;

  public clear() {
    (this.shadowRoot?.getElementById("input-field") as HTMLInputElement).value = "";
    this.value = "";
  }

  public setValue(value: string) {
    (this.shadowRoot?.getElementById("input-field") as HTMLInputElement).value = value;
    this.value = value;
  }

  render() {
    return html`
      <div class="container column" style="position: relative">
        <input
          id="input-field"
          type="text"
          class="textfield"
          .placeholder=${this.placeholder}
          ?required=${this.required}
          @input=${() => this.value = this.inputField.value}
          @keypress.enter=${() => this.dispatchEvent(new CustomEvent("enter-input", { bubbles: true, composed: true }))}
        />
      </div>

  `
  }

  static styles = [sharedStyles, css`

    .container {
      width: var(--mvb-textfield-width, 300px);
      height: var(--mvb-textfield-height, 48px);
      --default-primary-color: #9098b3;
      --default-secondary-color: #6f758a;
      --active-border-color: #9098b3;
     }

    .textfield {
      all: unset;
      text-align: left;
      height: 100%;
      padding: 0 10px;
      border-radius: 10px;
      border: var(--border-width, 2px) solid var(--mvb-secondary-color, --default-secondary-color);
      color: var(--mvb-primary-color);
      font-size: var(--mvb-textfield-font-size, 20px);
    }

    .textfield::placeholder {
      color: var(--mvb-primary-color, --default-primary-color);
      opacity: 0.5;
    }

    .textfield:focus {
      border: var(--border-width, 2px) solid var(--mvb-primary-color, --default-primary-color);
    }

  `];

}
