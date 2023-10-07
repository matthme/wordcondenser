import { LitElement, html, css } from 'lit';
import { state, customElement, property, query } from 'lit/decorators.js';

@customElement('loading-animation')
export class LoadingAnimation extends LitElement {
  @property()
  width: number = 100;

  @property()
  height: number = 100;

  render() {
    return html`
      <div class="container">
        <img
          id="logo"
          alt="Word Condenser logo"
          src="word_condenser_fog.svg"
          style="position: absolute; bottom: 0;"
        />
        <img
          src="word_condenser_wo_fog.svg"
          alt="Word Condenser logo"
          style="position: absolute; bottom: 0; height: 500px;"
        />
        <img
          id="drop"
          src="word_condenser_drop.svg"
          alt="Drop dropping out of the fog into an Erlenmeyer flask"
          style="position: absolute; bottom: 0; height: 500px;"
        />
      </div>

      <div style="opacity: 0.9; margin-top: 30px;">Loading...</div>
    `;
  }

  static styles = [
    css`
      .container {
        position: relative;
        height: 800px;
        display: flex;
        align-items: center;
        flex-direction: column;
        margin-top: -200px;
      }

      @keyframes condense {
        from {
          height: 650px;
          width: 800px;
          opacity: 0.3;
          bottom: -40px;
        }
        to {
          height: 450px;
          width: 500px;
          opacity: 1;
          bottom: 20px;
        }
      }

      @keyframes drop {
        0% {
          transform: translate(0, -30px);
          opacity: 0;
        }

        /* Finish changes by here */
        58% {
          transform: translate(0, -30px);
          opacity: 0.6;
        }

        /* Between 20% and 100%, nothing changes */
        72% {
          transform: translate(0, 40px);
          opacity: 1;
        }

        100% {
          transform: translate(0, 40px);
          opacity: 1;
        }
      }

      #logo {
        animation-name: condense;
        animation-duration: 3.5s;
        animation-iteration-count: infinite;
      }

      #drop {
        animation-name: drop;
        animation-duration: 3.5s;
        animation-iteration-count: infinite;
      }
    `,
  ];
}
