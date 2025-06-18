import { faGithub } from '@fortawesome/free-brands-svg-icons'; // Pour les icônes de marque
import { faBook, faHome, faTag, faXmark } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { motion } from 'framer-motion';

const Menu = ({ openMenu, setOpenMenu }: { openMenu: boolean; setOpenMenu: (openMenu: boolean) => void }) => {
  return (
    <>
      <motion.div
        initial={{ x: '-100%' }}
        animate={{ x: openMenu ? 0 : '-100%' }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="bg-neutral-800 text-white flex-col pt-1 top-0 left-0 h-full w-72 absolute z-50"
      >
        <div className="flex items-center justify-between">
          <h1 className="text-3xl">Menu</h1>

          <button onClick={() => setOpenMenu(!openMenu)}>
            <FontAwesomeIcon className="mr-3 size-6" icon={faXmark} />
          </button>
        </div>
        <div className="bg-neutral-800 text-white flex flex-col pt-6 gap-3 px-3 ">
          <div
            className={`font-bold flex gap-2 items-center pl-2 ${
              true && 'hover:bg-gray-300 bg-orange-500 rounded pl-2 hover:text-black'
            }`}
          >
            <FontAwesomeIcon icon={faHome} />
            Home
          </div>
          <div className="flex flex-col gap-1">
            <div className="font-bold flex gap-2 items-center pl-2 ">
              <FontAwesomeIcon icon={faBook} />
              Titles
            </div>

            <div className="pl-2">
              <div className="hover:bg-gray-300 rounded pl-2 hover:text-black">Avanced Search</div>
              <div className="hover:bg-gray-300 rounded pl-2 hover:text-black">Popular</div>
              <div className="hover:bg-gray-300 rounded pl-2 hover:text-black">Recently Added</div>
              <div className="hover:bg-gray-300 rounded pl-2 hover:text-black">Latest Updates</div>
              <div className="hover:bg-gray-300 rounded pl-2 hover:text-black">Random</div>
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <div className="font-bold flex gap-2 items-center pl-2">
              <FontAwesomeIcon icon={faTag} />
              Browses Genres
            </div>
            <div className="pl-2">
              <div className="hover:bg-gray-300 rounded pl-2 hover:text-black">Action</div>
              <div className="hover:bg-gray-300 rounded pl-2 hover:text-black">Romance</div>
              <div className="hover:bg-gray-300 rounded pl-2 hover:text-black">Comedy</div>
              <div className="hover:bg-gray-300 rounded pl-2 hover:text-black">Drama</div>
              <div className="hover:bg-gray-300 rounded pl-2 hover:text-black">Random</div>
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <div className="font-bold flex gap-2 items-center pl-2">
              <FontAwesomeIcon icon={faGithub} />
              Github
            </div>
            <div className="pl-2">
              <div className="hover:bg-gray-300 rounded pl-2 hover:text-black">Front</div>
              <div className="hover:bg-gray-300 rounded pl-2 hover:text-black">Back</div>
            </div>
          </div>
        </div>
      </motion.div>
      <div
        className={`overlay ${openMenu ? 'overlay-visible' : 'overlay-hidden'}`}
        onClick={() => setOpenMenu(false)}
      />
    </>
  );
};

export default Menu;
