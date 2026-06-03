import { CanvasOverlay } from './CanvasOverlay';

export function App() {
  return (
    <>
      <CanvasOverlay />
      <div className="container">
        <h1>Canvas Overlay POC</h1>

        <p>
          This is a simple demo of a <mark>canvas overlay</mark> that renders highlighter
          strokes above marked text.
        </p>

        <p>
          The component scans for <mark>mark elements</mark> in the DOM and draws rectangles
          over them on a canvas layer that sits <mark>above the document</mark>.
        </p>

        <p>
          Try scrolling down to see the overlay <mark>follow your scroll</mark> position.
        </p>

        <p>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do <mark>eiusmod tempor</mark>{' '}
          incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud
          exercitation ullamco laboris.
        </p>

        <p>
          Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat
          nulla pariatur. Excepteur sint occaecat <mark>cupidatat non proident</mark>, sunt in
          culpa qui officia deserunt mollit anim id est laborum.
        </p>

        <p>
          Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque
          laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi{' '}
          <mark>architecto beatae vitae</mark> dicta sunt explicabo.
        </p>

        <p>
          Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia
          consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt.
        </p>

        <p>
          Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet, consectetur, adipisci
          velit, sed quia non numquam eius modi tempora incidunt ut labore et dolore magnam
          aliquam quaerat voluptatem.
        </p>

        <p>
          Ut enim ad minima veniam, quis <mark>nostrum exercitationem</mark> ullam corporis
          suscipit laboriosam, nisi ut quid ex ea commodi consequatur.
        </p>
      </div>
    </>
  );
}
