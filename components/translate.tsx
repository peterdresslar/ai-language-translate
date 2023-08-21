// Hey Github Copilot, are you there? 
// I need help with this component.

// This component contains controls that allow the user to input text (up to 4000 tokens worth) and submit it to be translated from English to Samoan or Samoan to English.
// There should be a text area to capture the user's input.
// There should be a toggle swith to select the direction of translation. (English to Samoan or Samoan to English)
// There should be a button submit and a button to clear the text area.
// And finally, of course, there should be a text display to display the translated text. 
// We will want users to be able to cut and paste easily from this display (we could add a clipboard copy button.)
// Oh, very importantly, we want to be able to capture user feedback on the translation. So, we need controls for thumbs up, thumbs down, and (maybe) a text area for comments.
'use client';
import Container from "./container";
import { fetchEventSource } from '@microsoft/fetch-event-source';
import { FormEvent, useCallback, useState } from 'react';

export const runtime = 'edge';

export default function Translate() {
    const [translateMode, setTranslateMode] = useState("toSamoan");
    const [input, setInput] = useState("");
    
    const [inflight, setInflight] = useState(false);
    const [results, setResults] = useState("Results will appear here.");

    const submitHandler = useCallback(
        async (e: FormEvent) => {
            e.preventDefault();
            console.log('in event');

            // Prevent multiple submissions.
            if (inflight) return;

            // Reset results
            setInflight(true);
            setResults("");

            try {
                console.log('streaming');
                //determine which translateMode we are in by reading the radio button value
                await fetchEventSource('/api/translate', {
                    method: 'POST',
                    body: JSON.stringify({ translateMode: translateMode, input: input }),
                    headers: { 'Content-Type': 'application/json' },
                    onmessage(ev) {
                        setResults((r) => r + ev.data);
                    },
                });
            } catch (error) {
                console.error(error);
                setInflight(false);
                setResults("An error has occurred. Please try again. Error: " + error + ".");
            } finally {
                setInflight(false);
            }
        },
        [input, inflight]
    );

    return (
            <Container className="flex flex-wrap mb-20 lg:gap-10 lg:flex-nowrap h-5/6 ">
                {/* All right, we now start on the left side with a half-width column containing a control strip at the top and a text area below. */}
                <div className="translate-pane-left">
                    {/* Here is the control strip */}
                    <form onSubmit={submitHandler}>
                    <div className="control-strip">
                        {/* Here is the toggle switch to select the direction of translation. (English to Samoan or Samoan to English) */}
                        <div className="grid grid-cols-3">
                            <div className="col-span-2 ">
                                <div className="control-strip-item">
                                    <div className="flex items-center pl-4 border border-gray-200 rounded dark:border-gray-700">
                                        <input type="radio" defaultChecked id="translate-mode-1" name="translate-mode" value="toSamoan" 
                                            onChange={(e) => setTranslateMode(e.target.value)}/>
                                        <label htmlFor="translate-mode-1" className="ml-3 text-gray-700 dark:text-gray-300">English to Samoan</label>
                                    </div>
                                    <div className="flex items-center pl-4 border border-gray-200 rounded dark:border-gray-700">
                                        <input type="radio" id="translate-mode-2" name="translate-mode" value="toEnglish" 
                                                                                    onChange={(e) => setTranslateMode(e.target.value)}/>
                                        <label htmlFor="translate-mode-2" className="ml-3 text-gray-700 dark:text-gray-300">Samoan to English</label>
                                    </div>
                                </div>
                            </div>
                            {/* // Here is the button to clear the text area. */}
                            <div className="flex justify-end col-span-1 gap-1">
                                <div className="control-strip-item">
                                    <button className="bg-blue-500 hover:bg-blue-700 text-white font py-2 px-4 rounded" type="reset">Clear</button>
                                </div>
                                {/* // Here is the button to submit the text area. */}
                                <div className="control-strip-item">
                                    <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded" type="submit">Submit</button>
                                </div>
                            </div>
                        </div>
                    </div>
                    {/* // Here is the text area with a placeholder communicating the maximum number of tokens (let's just say 2000 Characters) allowed. */}
                    <div className="text-input-container">
                        <textarea id="textInputArea" className="text-input-area" placeholder="Enter text to be translated (up to 2000 characters) here."
                            onChange={(e) => setInput(e.target.value)}>
                        </textarea>
                    </div>
                    </form>
                </div>

                {/* // Now we move to the right side with a half-width column containing a control strip at the top and the results pane below. */}
                <div className="translate-pane-right">
                    {/* // Here is the control strip */}
                    <div className="control-strip">
                        <div className="grid grid-cols-3">
                            {/* // Here is the button to copy the results pane to the clipboard. */}
                            <div className="col-span-2 ">
                                <button className="bg-blue-500 hover:bg-blue-700 text-white font py-2 px-4 rounded" disabled>Copy to Clipboard</button>
                            </div>
                            {/* // Here is the thumbs up button. */}
                            <div className="flex justify-end col-span-1 gap-1">

                                <div className="control-strip-item">
                                    <button className="bg-blue-500 hover:bg-blue-700 text-white font py-2 px-4 rounded" disabled>Good</button>
                                </div>
                                {/* // Here is the thumbs down button. */}
                                <div className="control-strip-item">
                                    <button className="bg-blue-500 hover:bg-blue-700 text-white font py-2 px-4 rounded" disabled>Bad</button>
                                </div>
                            </div>
                        </div>
                    </div>
                    {/* // Here is the results pane. It's a div with a preformatted text area inside. It will scroll if the text is too long. */}
                    <div className="results-container">
                        <pre id="resultsTextArea" className="results-text-area">{results}</pre>
                    </div>
                </div>
            </Container>
    );
}





