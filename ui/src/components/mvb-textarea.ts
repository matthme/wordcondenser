import { LitElement, html, css } from 'lit';
import { state, customElement, property, query } from 'lit/decorators.js';
import { sharedStyles } from '../sharedStyles';




@customElement('mvb-textarea')
export class MVBTextArea extends LitElement {

  @property() placeholder: string = "";

  @property() rows: number = 4;

  @property() cols: number = 50;

  @property() width: string | undefined;

  @state()
  value: string = "";

  @query("#textarea-field")
  textAreaField!: HTMLInputElement;

  public clear() {
    (this.shadowRoot?.getElementById("textarea-field") as HTMLTextAreaElement).value = "";
    this.value = "";
  }
  public setValue(value: string) {
    (this.shadowRoot?.getElementById("textarea-field") as HTMLTextAreaElement).value = value;
    this.value = value;
  }


  render() {
    return html`
      <div class="wrapper column">
        <div class="container" style="position: relative">
          <textarea
            id="textarea-field"
            type="text"
            class="textarea"
            style="${this.width ? `width: ${this.width}` : ""}"
            .placeholder=${this.placeholder}
            .rows=${this.rows}
            .cols=${this.cols}
            required
            @input=${() => this.value = this.textAreaField.value}
          ></textarea>
      </div>
    </div>
  `

  }

  static styles = [sharedStyles, css`

    .wrapper {
      position: relative;
      --default-primary-color: #9098b3;
      --default-secondary-color: #6f758a;
      --active-border-color: #9098b3;
    }

    .container {
      border-radius: 10px;
      border: 2px solid var(--mvb-secondary-color, --default-secondary-color);
    }

    .container:focus-within {
      border: 2px solid var(--mvb-primary-color, --default-secondary-color);
    }

    .textarea {
      all: unset;
      text-align: left;
      margin: 10px 10px 0px 10px;
      height: 100%;
      padding: 0 10px;
      color: var(--mvb-primary-color);
      font-size: var(--mvb-textfield-font-size, 20px);
      resize: both;
    }

    .textarea::placeholder {
      color: var(--mvb-primary-color);
      opacity: 0.5;
    }
  `];

}
