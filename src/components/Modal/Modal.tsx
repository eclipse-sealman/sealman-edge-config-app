import { Dialog, Transition } from '@headlessui/react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { Fragment } from 'react'

export interface ModalState {
  isOpen: boolean
  title?: React.ReactNode
  children: React.ReactNode
}

interface ModalProps {
  modalState: ModalState,
  setModalState: React.Dispatch<React.SetStateAction<ModalState>>
}

export default function Modal({ modalState, setModalState }: ModalProps) {

  function closeModal() {
    setModalState({
      ...modalState,
      isOpen: false
    })
  }

  return (
    <>
      <Transition appear show={modalState.isOpen} as={Fragment}>
        <Dialog as="div" className="relative z-30" onClose={closeModal}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/25" />
          </Transition.Child>

          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <Dialog.Panel className="fixed inset-0 m-16 rounded-sm p-6 bg-white flex flex-col">
              <div className="flex mb-2">
                <Dialog.Title className="grow">{modalState.title}</Dialog.Title>
                <button className="outline-hidden" onClick={() => closeModal()}><XMarkIcon className="h-6 w-6"/></button>
              </div>
              {modalState.children}
            </Dialog.Panel>
          </Transition.Child>
        </Dialog>
      </Transition>
    </>
  )
}
