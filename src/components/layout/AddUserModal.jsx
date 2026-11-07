import { useState } from "react";
import Modal from "../common/Modal";
import Button from "../common/Button";
import AddUserForm from "../user/AddUserForm";

const ADD_USER_FORM_ID = "add-user-form";

const AddUserModal = ({ open, onClose, onSaved, companyId }) => {
  const [submitting, setSubmitting] = useState(false);

  const handleSuccess = () => {
    onSaved?.();
    onClose?.();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add User"
      size="md"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button
            type="submit"
            form={ADD_USER_FORM_ID}
            loading={submitting}
            loadingText="Creating..."
          >
            Create User
          </Button>
        </div>
      }
    >
      {/*
        Using the `key` forces React to recreate the form every
        time the modal is reopened, ensuring a fresh form state.
      */}
      <AddUserForm
        key={open ? "open" : "closed"}
        formId={ADD_USER_FORM_ID}
        companyId={companyId}
        onSuccess={handleSuccess}
        onLoadingChange={setSubmitting}
      />
    </Modal>
  );
};

export default AddUserModal;
