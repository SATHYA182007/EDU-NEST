import UploadForm from "../UploadForm";

export default function UploadPage({ user }) {
    return (
        <div className="flex-1 overflow-y-auto bg-background p-6 md:p-10 flex justify-center items-start pb-20">
            <UploadForm user={user} />
        </div>
    );
}
