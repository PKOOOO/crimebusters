import classes from './Halo.module.scss'
import { assetsUrl } from '@educaplay/core/utils';

const imageSrc = assetsUrl('common/bg-sun-rays.svg');

function Halo() {
  return (
      <img src={imageSrc} alt='' className={classes.image} />
  );
}

export default Halo;