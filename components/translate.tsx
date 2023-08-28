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
import { FormEvent, useCallback, useEffect, useState } from 'react';

import { createClient } from '@supabase/supabase-js';

export const runtime = 'edge';

export default function Translate() {
    const [translateMode, setTranslateMode] = useState("toSamoan");
    const [sourceLang, setSourceLang] = useState("en");
    const [targetLang, setTargetLang] = useState("sm");
    const [input, setInput] = useState("");
    const [clipboardBtnText, setClipboardBtnText] = useState("Copy to Clipboard");
    const [modelConfigId, setModelConfigId] = useState(1);
    const [userId, setUserId] = useState(1); // later we can add users

    const [inflight, setInflight] = useState(false);
    const [results, setResults] = useState("Results will appear here.");
    const [transactionId , setTransactionId] = useState(""); //this id for translation will be used to assign the feedback to the correct translation record


    // Eventually should move this to a route  
    const getNewTransactionId = async () => {
        const dbClient = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_PRIVATE_KEY
        );
        let transactionId = "";
        try {
            let {data, error} = await dbClient
            .from('translations')
            .insert({ user_id: userId, model_config_id: modelConfigId, translate_mode: translateMode, prompt: input, source_lang: sourceLang, target_lang: targetLang, response: results })
            .select();
            console.log(data);
            if (data) {
              transactionId = data[0].transaction_id;
            }
        } catch (error) {
          console.log('New transaction insert error', error);
        } finally {
            return transactionId;
        }
    }

    const updateTranslateMode = (value: string) => {
        setTranslateMode(value);
        //flip the source and target languages
        if (value === "toSamoan") {
            setSourceLang("en");
            setTargetLang("sm");
        } else if (value === "toEnglish") {
            setSourceLang("sm");
            setTargetLang("en");
        }
    }

    const handleInputChange = (value: string) => {
        setInput(value);
        //enable btnSubmit if input is not empty
        if (value.length > 0) {
            document.getElementById("btnSubmit")!.removeAttribute("disabled");
        } else {
            document.getElementById("btnSubmit")!.setAttribute("disabled", "true");
        }
        //check if the btnSubmit is enabled
    };

    const handleClear = () => {
        setInput("");
        setResults("");
        setTransactionId("");
        document.getElementById("btnSubmit")!.setAttribute("disabled", "true");
        setClipboardBtnText("Copy to Clipboard");
    };

    const handleClippy = (value: string) => {
        navigator.clipboard.writeText(value);
        //write a clipboard icon to the clipboard button text
        setClipboardBtnText("Copied. ☑️");
    };

    const submitHandler = useCallback(
        async (e: FormEvent) => {
            e.preventDefault();
            console.log('in event');
            
            // first, get a generated transactionId from supabase. This will allow us to track the user feedback for this translation.
            // using the Supabase client

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
                    body: JSON.stringify({ translateMode: translateMode, input: input, modelConfigId: modelConfigId }), //modelConfig is hard-coded for now
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
                const tId = await getNewTransactionId();
                console.log('transactionId: ' + tId);
                setTransactionId(tId);
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
                                <div>
                                    <div className="flex items-center pl-4 border border-gray-200 rounded dark:border-gray-700">
                                        <input type="radio" defaultChecked id="translate-mode-1" name="translate-mode" value="toSamoan"
                                            onChange={(e) => updateTranslateMode(e.target.value)} />
                                        <label htmlFor="translate-mode-1" className="ml-3 text-gray-700 dark:text-gray-300">English to Samoan</label>
                                    </div>
                                    <div className="flex items-center pl-4 border border-gray-200 rounded dark:border-gray-700">
                                        <input type="radio" id="translate-mode-2" name="translate-mode" value="toEnglish"
                                            onChange={(e) => updateTranslateMode(e.target.value)} />
                                        <label htmlFor="translate-mode-2" className="ml-3 text-gray-700 dark:text-gray-300">Samoan to English</label>
                                    </div>
                                </div>
                            </div>
                            {/* // Here is the button to clear the text area. */}
                            <div className="flex justify-end col-span-1 gap-1">
                                <div>
                                    <button className="control-strip-item" id="btnClear" type="reset" onClick={handleClear}>Clear</button>
                                </div>
                                {/* // Here is the button to submit the text area. */}
                                <div>
                                    <button className="control-strip-item font-bold" id="btnSubmit" type="submit" disabled>Submit</button>
                                </div>
                            </div>
                        </div>
                    </div>
                    {/* // Here is the text area with a placeholder communicating the maximum number of tokens (let's just say 2000 Characters) allowed. */}
                    <div className="text-input-container">
                        <textarea id="textInputArea" className="text-input-area" placeholder="Enter text to be translated (up to 2000 characters) here."
                            onChange={(e) => handleInputChange(e.target.value)}>
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
                            <button className="control-strip-item" id="btnCopy" 
                                onClick={(e) => handleClippy(results)}>{clipboardBtnText}</button>
                        </div>
                        {/* // Here is the thumbs up button. */}
                        <div className="flex justify-end col-span-1 gap-1">
                            <div>
                                <button className="control-strip-item" 
                                disabled
                                data-te-toggle="tooltip"
                                data-te-placement="top"
                                data-te-ripple-init
                                data-te-ripple-color="light"
                                title="User feedback coming soon!">Good</button>
                            </div>
                            {/* // Here is the thumbs down button. */}
                            <div>
                                <button className="control-strip-item" 
                                disabled
                                data-te-toggle="tooltip"
                                data-te-placement="top"
                                data-te-ripple-init
                                data-te-ripple-color="light"
                                title="User feedback coming soon!">Bad</button>
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





