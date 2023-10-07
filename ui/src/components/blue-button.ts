import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { sharedStyles } from '../sharedStyles';

@customElement('mvb-button')
export class MVBButton extends LitElement {
  @property() disabled = false;

  render() {
    return html`
      <button
        class=${classMap({
          btnDisabled: this.disabled,
          btn: !this.disabled,
        })}
        @click=${(e: Event) => {
          if (this.disabled) {
            e.stopPropagation();
          }
        }}
      >
        <slot></slot>
      </button>
    `;
  }

  static styles = [
    sharedStyles,
    css`
      button {
        --default-primary-color: #9098b3;
        --default-secondary-color: #6f758a;
        --default-disabled-color: #8c91a2;
        --default-text-color: #576592;
        --default-disabled-text-color: #7c87ad;
      }

      .btn {
        all: unset;
        background-color: var(--mvb-primary-color, --default-primary-color);
        color: var(--mvb-button-text-color, --default-text-color);
        width: intrinsic;
        /* height: 60px; */
        padding: 20px;
        text-align: center;
        /* color: #ffffff; */
        border-radius: 20px;
        cursor: pointer;
      }

      .btn:hover {
        background-color: var(--mvb-secondary-color, --default-secondary-color);
      }

      .btn:focus-visible {
        background-color: var(--mvb-secondary-color, --default-secondary-color);
        box-shadow: 0px 0px 4px
          var(--mvb-primary-color, --default-secondary-color);
      }

      .btnDisabled {
        all: unset;
        background-color: var(--mvb-primary-color, --default-primary-color);
        color: var(
          --mvb-button-disabled-text-color,
          --default-disabled-text-color
        );
        width: intrinsic;
        /* height: 60px; */
        padding: 20px;
        text-align: center;
        /* color: #ffffff; */
        border-radius: 20px;
        cursor: pointer;
      }
    `,
  ];
}
