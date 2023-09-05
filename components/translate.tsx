'use client';
import Container from "./container";
import { fetchEventSource } from '@microsoft/fetch-event-source';
import { FormEvent, useCallback, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import Select from "react-select";

export const runtime = 'edge';

const dbClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_PRIVATE_KEY
);

type TranslateOption = {
    readonly idx: number;
    readonly value: string;
    readonly label: string;
}

export default function Translate() {
    const translateOptions: TranslateOption[] = [
        { idx: 0, value: 'englishToSamoan', label: 'English to Samoan' },
        { idx: 1, value: 'samoanToEnglish', label: 'Samoan to English' },
        { idx: 2, value: 'englishToChamorro', label: 'English to Chamorro' },
        { idx: 3, value: 'chamorroToEnglish', label: 'Chamorro to English' }
    ];
    const [translateMode, setTranslatemode] = useState(""); 
    const [upvoteDisabled, setUpvoteDisabled] = useState(true);
    const [downvoteDisabled, setDownvoteDisabled] = useState(true);
    const [sourceLang, setSourceLang] = useState("en");
    const [targetLang, setTargetLang] = useState("sm");
    const [input, setInput] = useState("");
    const [clipboardBtnText, setClipboardBtnText] = useState("Copy to Clipboard");
    const [modelConfigId, setModelConfigId] = useState(1);
    const [userId, setUserId] = useState(1); // later we can add users

    const [inflight, setInflight] = useState(false);
    const [results, setResults] = useState("Results will appear here.");
    const [transactionId, setTransactionId] = useState(""); //this id for translation will be used to assign the feedback to the correct translation record

    // Eventually should move this to a route  
    // returns the transactionId
    const writeTranslationToDb = async (resultsText: String) => {
        let transactionId = "";
        console.log("writing to db for sourcelang " + sourceLang + " and targetlang " + targetLang);
        try {
            let { data, error } = await dbClient
                .from('translations')
                .insert({ user_id: userId, model_config: modelConfigId, prompt: input, source_lang: sourceLang, target_lang: targetLang, response: resultsText })
                .select();
            if (error) {
                console.log("m " + error.message);
                console.log("h " + error.hint);
                console.log("d " + error.details);
                return transactionId;
            }
            if (data) {
                console.log('data is not null');
                transactionId = data[0].transaction_id;
            }
        } catch (error) {
            console.log('New transaction insert error', error);
        } finally {
            return transactionId;
        }
    }

    const updateTranslationWithFeedback = async (feedback: String, transactionId: String) => {
        console.log("updating db with feedback " + feedback + " for transactionId " + transactionId);
        try {
            let { data, error } = await dbClient
                .from('translations')
                .update({ feedback_state: feedback })
                .eq('transaction_id', transactionId)
            if (error) {
                console.log("m " + error.message);
            } else {
                console.log('feedback updated');
            }
        } catch (error) {
            console.log('Feedback update error', error);
        }
    }

    const updateTranslateMode = (option: TranslateOption | null) => {
        if (option) {
            console.log("updateTranslateMode called with " + option.value);
            setTranslatemode(option.value);
            if (option.value === "englishToSamoan") {
                setSourceLang("en");
                setTargetLang("sm");
            } else if (option.value === "samoanToEnglish") {
                setSourceLang("sm");
                setTargetLang("en");
            } else if (option.value === "englishToChamorro") {
                setSourceLang("en");
                setTargetLang("ch");
            } else if (option.value === "chamorroToEnglish") {
                setSourceLang("ch");
                setTargetLang("en");
            }
            // if the input is not empty, enable the submit button
            if (input.length > 0) {
                document.getElementById("btnSubmit")!.removeAttribute("disabled");
            }
        } //ending the if (option) statement
    }

    const handleInputChange = (value: string) => {
        setInput(value);
        //enable btnSubmit if input is not empty and a language has been selected
        if (value.length > 0 && translateMode.length > 0) {
            document.getElementById("btnSubmit")!.removeAttribute("disabled");
        } else {
            document.getElementById("btnSubmit")!.setAttribute("disabled", "true");
        }
        //check if the btnSubmit is enabled
    };

    const handleClear = () => {
        setInput("");
        setResults("Results will appear here.");
        setTransactionId("");
        disableSubmitButton(true);
        disableFeedbackButtons();
        setClipboardBtnText("Copy to Clipboard");
        document.getElementById("btnUpvote")!.innerText = "👍";
        document.getElementById("btnDownvote")!.innerText = "👎";
        // debugging select:
        console.log("translateMode is now " + translateMode);
        console.log("sourceLang is now " + sourceLang + " and targetLang is now " + targetLang);
    };

    const handleClippy = (value: string) => {
        navigator.clipboard.writeText(value);
        //write a clipboard icon to the clipboard button text
        setClipboardBtnText("Copied. 📋");
    };

    const disableSubmitButton = (disable: boolean) => {
        if (disable) {
            document.getElementById("btnSubmit")!.setAttribute("disabled", "true");
        } else {
            document.getElementById("btnSubmit")!.removeAttribute("disabled");
        }
    };

    const disableLanguageSelect = (disable: boolean) => {
        if (disable) {
            document.getElementById("modelSelector")!.setAttribute("disabled", "true");
        } else {
            document.getElementById("modelSelector")!.removeAttribute("disabled");
        }
    };

    const enableFeedbackButtons = () => {
        //enable the feedback buttons
        setUpvoteDisabled(false);
        setDownvoteDisabled(false);
    };

    const disableFeedbackButtons = () => {
        //disable the feedback buttons and clear out any checkmarks from the text
        setUpvoteDisabled(true);
        setDownvoteDisabled(true);
    };

    const handleUpvote = () => {
        console.log("upvote clicked");
        //change the text of the feedback button
        document.getElementById("btnUpvote")!.innerText = "👍 ☑️";
        //disable the feedback buttons
        disableFeedbackButtons();
        //update the translation record with the feedback
        updateTranslationWithFeedback("upvote", transactionId);
    }


    const handleDownvote = async () => {
        console.log("downvote clicked");
        //change the text of the feedback button
        document.getElementById("btnDownvote")!.innerText = "👎 ☑️";
        //disable the feedback buttons
        disableFeedbackButtons();
        //update the translation record with the feedback
        updateTranslationWithFeedback("downvote", transactionId);
    };

    const submitHandler = useCallback(
        async (e: FormEvent) => {
            e.preventDefault();
            console.log('in event');

            // Prevent multiple submissions.
            if (inflight) return;

            // Reset results
            setInflight(true);
            setResults("");

            // Handle inflght-ness
            disableFeedbackButtons();
            setClipboardBtnText("Copy to Clipboard");
            disableSubmitButton(true);
            disableLanguageSelect(true);

            try {
                console.log('streaming');
                console.log('modelConfigId: ' + modelConfigId + ' translateMode: ' + translateMode);
                if (modelConfigId != 3) {
                    //determine which translateMode we are in by reading the radio button value
                    await fetchEventSource('/api/translate', {
                        method: 'POST',
                        body: JSON.stringify({ translateMode: translateMode, input: input, modelConfigId: modelConfigId }), //modelConfig is hard-coded for now
                        headers: { 'Content-Type': 'application/json' },
                        onmessage(ev) {
                            setResults((r) => r + ev.data);
                        }
                    });
                } else { // special processing for llama 2 70B model for now
                    console.log('streaming llama 2 70B');

                    // here we will fetch from /api/translate, which will return a Response with a streaming text body. we will write the stream to console and also use the stream to update our results text area.

                    const response = await fetch('/api/translate', {
                        method: 'POST',
                        body: JSON.stringify({ translateMode: translateMode, input: input, modelConfigId: modelConfigId }), //modelConfig is hard-coded for now
                        headers: { 'Content-Type': 'application/json' },
                    });
                    const reader = response.body!.getReader();
                    const decoder = new TextDecoder();
                    let resultsText = "";
                    while (true) {
                        const { done, value } = await reader.read();
                        if (done) {
                            break;
                        }
                        resultsText += decoder.decode(value);
                        console.log(decoder.decode(value));
                    }
                    setResults(resultsText);
                    console.log('streaming llama 2 70B complete');
                }
                // get the inner text of the resultsTextArea and write it to the database.
                //note that there should be a better stateful way to do this.
                const resultsText = document.getElementById("resultsTextArea")!.innerText;
                const tId = await writeTranslationToDb(resultsText);
                console.log('transactionId: ' + tId);
                setTransactionId(tId);
                enableFeedbackButtons();
            } catch (error) {
                console.error(error);
                setResults("An error has occurred. Please try again. Error: " + error + ".");
            } finally {
                setInflight(false);
                disableLanguageSelect(false);
                disableSubmitButton(false);
            }
        },
        [input, inflight]
    );

    return (
        <Container className="mb-20">
            {/* Row for all of the controls and operations */}
            <div className="flex flex-wrap lg:flex-nowrap justify-center align-start gap-4 h-5/6">
                {/* All right, we now start on the left side with a half-width column containing a control strip at the top and a text area below. */}
                <div className="translate-pane-left">
                    {/* Here is the control strip */}
                    <form onSubmit={submitHandler}>
                        <div className="control-strip">
                            {/* Here is the toggle switch to select the direction of translation. (English to Samoan or Samoan to English) */}
                            <div className="grid grid-cols-3">
                                <div className="col-span-2 ">
                                    <Select
                                        theme={(theme) => ({
                                            ...theme,
                                            borderRadius: 0,
                                            colors: {
                                                ...theme.colors,
                                                primary25: '#93c5fd',
                                                primary: '#3b82f6',
                                            },
                                        })}
                                        classNamePrefix="react-select-translate"
                                        placeholder="Select languages for translation"
                                        options={translateOptions}
                                        // defaultValue={translateOptions[0]}
                                        onChange={(e) => updateTranslateMode(e)}
                                    />

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
                                        disabled={upvoteDisabled}
                                        id="btnUpvote"
                                        onClick={(e) => handleUpvote()}>👍</button>
                                </div>
                                {/* // Here is the thumbs down button. */}
                                <div>
                                    <button className="control-strip-item"
                                        disabled={downvoteDisabled}
                                        id="btnDownvote"
                                        onClick={(e) => handleDownvote()}>👎</button>
                                </div>
                            </div>
                        </div>
                    </div>
                    {/* // Here is the results pane. It's a div with a preformatted text area inside. It will scroll if the text is too long. */}
                    <div className="results-container">
                        <pre id="resultsTextArea" className="results-text-area">{results}</pre>
                    </div>
                </div>
            </div>
            {/* We have a hideable technical options section in a new row next, which is a collapsed div with an unhide-button */}
            <hr className="mt-10 border-sky-700 dark:border-gray-100"></hr>
            <div className="technical-options flex justify-center mt-5">
                <div className="grid grid-rows-2">
                    <div className="row flex justify-center">
                        <h2 className="justify-center mb-5">Fa'amatalaga fa'apitoa <em>(Technical details)</em></h2>
                    </div>
                    <div className="row md:flex md:items-center gap-10 justify-center">
                        <div className="md:w-1/2">
                            {/* model selector dropdown with the two hardcoded options for now */}
                            <select className="form-select text-sm control-strip-item" id="modelSelector" onChange={(e) => setModelConfigId(Number(e.target.value))}>
                                <option value="1">OpenAI GPT-4</option>
                                <option value="2">OpenAI GPT-3.5</option>
                                <option value="3">Meta Llama 2 70B (fa'atamala/slow)</option>
                            </select>
                        </div>
                        <div className="md:w-1/2">
                            <pre className="text-sm">Application version 0.0.1</pre>
                        </div>
                    </div>
                </div>
            </div>
            <hr className="mt-10 border-sky-700 dark:border-gray-100"></hr>
        </Container>
    );
}





