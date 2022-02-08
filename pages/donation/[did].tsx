/* eslint-disable @next/next/no-img-element */
import { v4 as randomUUID } from "uuid";
import type { GetServerSideProps, NextPage } from "next";
import Head from "next/head";
import Image from "next/image";
import { Footer } from "../../components/Footer";
import { Header } from "../../components/Header";
import { getDb } from "../../lib/api/mongodb";
import { useEffect, useMemo, useState } from "react";
import { ObjectId, WithId } from "mongodb";
import Delta from "quill-delta";
import { DbDonation } from "../../lib/interfaces/Donation";
import QrCode from "qrcode.react";
import { setTimeout as setTimeoutCb } from "timers";
import axios, { AxiosResponse } from "axios";
import { promisify } from "util";
import useInterval from "../../utils/useInterval";
import useTimeout from "../../utils/useTimeout";
import { useRouter } from "next/router";
// Derive Imports
const setTimeout = promisify(setTimeoutCb);
// Define Types
interface DonationPageProps {
    invoice: string;
    donationId: string;
}
// Define Page
const Donation: NextPage<DonationPageProps> = ({ invoice, donationId }) => {
    // Define State
    const router = useRouter();
    const [paid, setPaid] = useState(false);
    // Define Timers
    useInterval(
        async () => {
            const result: AxiosResponse<{
                status: "success";
                message: string;
                data: {
                    paid: boolean;
                };
            }> = await axios.get(`/api/donation/${donationId}`);
            setPaid(result.data.data.paid);
        },
        paid ? null : 5000
    );
    useEffect(() => {
        if (paid) {
            setTimeoutCb(() => router.push("/"), 2000);
        }
    }, [paid, router]);
    // Define Subrenders
    const paidDisplay = useMemo(() => {
        if (paid) {
            return (
                <span className="text-3xl text-center font-bold font-fm-primary text-green-500">
                    Pago
                </span>
            );
        } else {
            return (
                <span className="text-3xl text-center font-bold font-fm-primary text-red-500">
                    Pendente
                </span>
            );
        }
    }, [paid]);
    // Define Render
    return (
        <>
            <Head>
                <title>Contribuir</title>
                <meta
                    name="description"
                    content="Generated by create next app"
                />
                <link rel="icon" href="/favicon.ico" />
            </Head>

            <Header></Header>
            <main className="mx-auto max-w-7xl pb-8 sm:min-h-[calc(100vh-9.5rem)]">
                <div className="px-8 my-8 py-6 bg-white rounded-lg drop-shadow space-y-8 flex flex-col">
                    <h1 className="text-center text-4xl font-bold font-fm-primary">
                        Contribuir
                    </h1>
                    <hr />
                    <div className="mx-auto rounded-lg overflow-hidden drop-shadow-lg">
                        <QrCode value={invoice} size={512} />
                    </div>
                    <hr />
                    {paidDisplay}
                </div>
            </main>

            <Footer />
        </>
    );
};

export default Donation;
// Export Server Side Functions
export const getServerSideProps: GetServerSideProps<
    DonationPageProps,
    { did: string }
> = async (context) => {
    // Fetch Data
    const donationId = context.params?.did;
    // Check Donation Id
    if (!donationId) return { notFound: true };
    // Fetch donation
    const db = await getDb();
    const donationDoc = await db
        .collection<DbDonation>("donations")
        .findOne({ _id: new ObjectId(donationId) });
    // Check found donation
    if (!donationDoc) return { notFound: true };
    // Return data
    return {
        props: { donationId, invoice: donationDoc.invoice },
    };
};