"use client";
import type { PublicKey } from "@solana/web3.js";
import { useState } from "react";
import {
	useCrudappProgram,
	useCrudappProgramAccount,
} from "./crudapp-data-access";
import { useWallet } from "@solana/wallet-adapter-react";

export function CrudappCreate() {
	const [title, setTitle] = useState("");
	const [message, setMessage] = useState("");

	const { createEntry } = useCrudappProgram();
	const { publicKey } = useWallet();

	const isFormValid = title.trim() !== "" && message.trim() !== "";

	const handleSubmit = (e: any) => {
		e.preventDefault();
		if (publicKey && isFormValid) {
			createEntry.mutateAsync({
				title,
				message,
				owner: publicKey,
			});
		} else {
			if (publicKey == null) {
				return <p>Connect your wallet </p>;
			}
		}
	};
	return (
		<form onSubmit={handleSubmit} className="">
			<div className="flex flex-row items-center gap-x-3 pb-5">
				<input
					name="title"
					type-="text"
					value={title}
					onChange={(e) => setTitle(e.target.value)}
					className="input input-bordered w-full max-w-xs"
				/>

				<textarea
					name="message"
					value={message}
					onChange={(e) => setMessage(e.target.value)}
					className="input input-bordered w-full max-w-xs"
				/>
			</div>
			<button
				type="submit"
				disabled={createEntry.isPending || !isFormValid}
				className="btn btn-xs lg:btn-md btn-primary"
			>
				Create journal entry
			</button>
		</form>
	);
}

export function CrudappList() {
	const { accounts, getProgramAccount } = useCrudappProgram();

	if (getProgramAccount.isLoading) {
		return <span className="loading loading-spinner loading-lg" />;
	}
	if (!getProgramAccount.data?.value) {
		return (
			<div className="alert alert-info flex justify-center">
				<span>
					Program account not found. Make sure you have deployed the program and
					are on the correct cluster.
				</span>
			</div>
		);
	}
	return (
		<div className={"space-y-6"}>
			{accounts.isLoading ? (
				<span className="loading loading-spinner loading-lg"></span>
			) : accounts.data?.length ? (
				<div className="grid md:grid-cols-2 gap-4">
					{accounts.data?.map((account) => (
						<CrudappCard
							key={account.publicKey.toString()}
							account={account.publicKey}
						/>
					))}
				</div>
			) : (
				<div className="text-center">
					<h2 className={"text-2xl"}>No accounts</h2>
					No accounts found. Create one above to get started.
				</div>
			)}
		</div>
	);
}

function CrudappCard({ account }: { account: PublicKey }) {
	const { accountQuery, updateEntry, deleteEntry } = useCrudappProgramAccount({
		account,
	});

	const { publicKey } = useWallet();
	const [message, setMessage] = useState("");

	const title = accountQuery.data?.title ?? "";

	const isFormValid = message.trim() !== "";

	const handleSubmit = () => {
		if (publicKey && isFormValid && title != null) {
			updateEntry.mutateAsync({
				title,
				message,
				owner: publicKey,
			});
		} else {
			if (publicKey == null) {
				return <p>Connect your wallet </p>;
			}
		}
	};

	return accountQuery.isLoading ? (
		<span className="loading loading-spinner loading-lg" />
	) : (
		<div className="card card-bordered border-base-300 border-4 text-neutral-content">
			<div className="card-body">
				<h2
					className="card-title justify-center text-3xl cursor-pointer"
					onClick={() => accountQuery.refetch()}
				>
					{accountQuery.data?.title}
				</h2>
				<textarea
					placeholder={accountQuery.data?.message}
					value={message}
					onChange={(e) => setMessage(e.target.value)}
					className="input input-bordered w-full max-w-xs"
				/>
				<div className="card-actions justify-around">
					<button
						onClick={handleSubmit}
						type="submit"
						className="btn btn-xs lg:btn-md btn-primary"
						disabled={!isFormValid || updateEntry.isPending}
					>
						Update journal entry
					</button>
					<button
						type="button"
						onClick={() => {
							const title = accountQuery.data?.title;
							if (title != null) {
								deleteEntry.mutateAsync(title);
							}
						}}
						className="btn btn-xs lg:btn-md btn-error"
						disabled={deleteEntry.isPending}
					>
						Delete journal entry
					</button>
				</div>
			</div>
		</div>
	);
}
