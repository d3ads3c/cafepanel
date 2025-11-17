"use client"
import React from 'react'

type Props = {
    visible: boolean
    onClose: (acknowledged?: boolean | 'ok' | string) => void
}

export default function LoveModal({ visible, onClose }: Props) {
    if (!visible) return null

    return (
        <div id="love-modal" className="fixed top-0 right-0 backdrop-blur-lg bg-black/30 flex items-center justify-center w-full h-screen">
            <div className="bg-white rounded-3xl p-10 w-[30%]">
                <h1 className="text-[5rem] mx-auto text-center">❤️</h1>
                <h2 className="text-xl text-center -mt-2 font-bold">خیلی دوست دارم</h2>
                <div className="flex items-center gap-3 justify-center mt-6">
                    <button onClick={() => onClose(true)} className="text-white bg-teal-600 rounded-xl py-3 px-6">منم دوست دارم</button>
                    <button onClick={() => onClose('ok')} className="text-teal-600 hover:bg-teal-100 duration-150 rounded-xl py-3 px-6">OK</button>
                </div>
            </div>
        </div>
    )
}