import { useDarkMode } from '../contexts/DarkModeProvider';

export default function PartLink({partNum}) {
  const {darkMode} = useDarkMode();
  const classes = [darkMode ? 'text-white-50' : 'text-black-50', 'inventory-partnum'];

  return (
    // eslint-disable-next-line
    <a target='_blank' className={classes.join(' ')} href={`https://rebrickable.com/parts/${partNum}/`}>
      {partNum}
    </a>
  );
}
