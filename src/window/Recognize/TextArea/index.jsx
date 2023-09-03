import { Card, CardBody, CardFooter, Button, Skeleton, ButtonGroup } from '@nextui-org/react';
import { sendNotification } from '@tauri-apps/api/notification';
import { writeText } from '@tauri-apps/api/clipboard';
import { atom, useAtom, useAtomValue } from 'jotai';
import React, { useEffect, useState } from 'react';
import { MdContentCopy } from 'react-icons/md';
import { MdSmartButton } from 'react-icons/md';
import { useTranslation } from 'react-i18next';
import { invoke } from '@tauri-apps/api';
import { nanoid } from 'nanoid';

import { serviceNameAtom, languageAtom, recognizeFlagAtom } from '../ControlArea';
import * as buildinServices from '../../../services/recognize';
import { useConfig } from '../../../hooks';
import { base64Atom } from '../ImageArea';

export const textAtom = atom();
let recognizeId = 0;

export default function TextArea() {
    const [autoCopy] = useConfig('recognize_auto_copy', false);
    const [deleteNewline] = useConfig('recognize_delete_newline', false);
    const [hideWindow] = useConfig('recognize_hide_window', false);
    const recognizeFlag = useAtomValue(recognizeFlagAtom);
    const serviceName = useAtomValue(serviceNameAtom);
    const language = useAtomValue(languageAtom);
    const base64 = useAtomValue(base64Atom);
    const [loading, setLoading] = useState(false);
    const [text, setText] = useAtom(textAtom);
    const [error, setError] = useState('');
    const { t } = useTranslation();

    useEffect(() => {
        if (base64 !== '' && serviceName && autoCopy !== null && deleteNewline !== null && hideWindow !== null) {
            setLoading(true);
            setText('');
            setError('');
            if (language in buildinServices[serviceName].Language) {
                let id = nanoid();
                recognizeId = id;
                buildinServices[serviceName].recognize(base64, buildinServices[serviceName].Language[language]).then(
                    (v) => {
                        if (recognizeId !== id) return;
                        if (deleteNewline) {
                            v = v.replace(/\s+/g, ' ');
                        }
                        setText(v);
                        setLoading(false);
                        if (autoCopy) {
                            writeText(v).then(() => {
                                if (hideWindow) {
                                    sendNotification({
                                        title: t('common.write_clipboard'),
                                        body: v,
                                    });
                                }
                            });
                        }
                    },
                    (e) => {
                        if (recognizeId !== id) return;
                        setError(e.toString());
                        setLoading(false);
                    }
                );
            } else {
                setError('Language not supported');
                setLoading(false);
            }
        }
    }, [base64, serviceName, language, recognizeFlag, autoCopy, deleteNewline, hideWindow]);

    return (
        <Card
            shadow='none'
            className='bg-content1 h-full ml-[6px] mr-[12px]'
            radius='10'
        >
            <CardBody className='bg-content1 p-0 h-full'>
                {loading ? (
                    <div className='space-y-3 m-[12px]'>
                        <Skeleton className='w-3/5 rounded-lg'>
                            <div className='h-3 w-3/5 rounded-lg bg-default-200'></div>
                        </Skeleton>
                        <Skeleton className='w-4/5 rounded-lg'>
                            <div className='h-3 w-4/5 rounded-lg bg-default-200'></div>
                        </Skeleton>
                        <Skeleton className='w-2/5 rounded-lg'>
                            <div className='h-3 w-2/5 rounded-lg bg-default-300'></div>
                        </Skeleton>
                    </div>
                ) : (
                    <>
                        {text && (
                            <textarea
                                value={text}
                                className='bg-content1 h-full m-[12px] mb-0 resize-none focus:outline-none'
                                onChange={(e) => {
                                    setText(e.target.value);
                                }}
                            />
                        )}
                        {error && (
                            <textarea
                                value={error}
                                readOnly
                                className='bg-content1 h-full m-[12px] mb-0 resize-none focus:outline-none text-red-500'
                                onChange={(e) => {
                                    setText(e.target.value);
                                }}
                            />
                        )}
                    </>
                )}
            </CardBody>
            <CardFooter className='bg-content1 flex justify-start px-[12px]'>
                <ButtonGroup>
                    <Button
                        isIconOnly
                        size='sm'
                        variant='light'
                        onPress={async () => {
                            await invoke('copy_img', {
                                width: imgRef.current.naturalWidth,
                                height: imgRef.current.naturalHeight,
                            });
                        }}
                    >
                        <MdContentCopy className='text-[16px]' />
                    </Button>
                    <Button
                        isIconOnly
                        variant='light'
                        size='sm'
                        onPress={() => {
                            setText(text.replace(/\s+/g, ' '));
                        }}
                    >
                        <MdSmartButton className='text-[16px]' />
                    </Button>
                </ButtonGroup>
            </CardFooter>
        </Card>
    );
}