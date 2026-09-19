import Modal from "../common/Modal";
import AddUserForm from "../user/AddUserForm";


const AddUserModal = ({ open, onClose, companyId }) => {
  const handleSuccess = () => {
    onClose?.();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add User"
      size="md"
      closeOnOutside={true}
      showCloseButton={true}
    >
      {/*
        Using the `key` forces React to recreate the form every
        time the modal is reopened, ensuring a fresh form state.
      */}
      <AddUserForm
        key={open ? "open" : "closed"}
        companyId={companyId}
        onSuccess={handleSuccess}
        onCancel={onClose}
      />
    </Modal>
  );
};

export default AddUserModal;
