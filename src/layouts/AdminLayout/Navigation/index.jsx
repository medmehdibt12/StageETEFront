import React, { useContext } from 'react';

import { ConfigContext } from '../../../contexts/ConfigContext';
import useWindowSize from '../../../hooks/useWindowSize';

import NavLogo from './NavLogo';
import NavContent from './NavContent';
import getMenuItems from '../../../menu-items';

const Navigation = () => {
  const configContext = useContext(ConfigContext);
  const { collapseMenu } = configContext.state;
  const windowSize = useWindowSize();

  const navigation = getMenuItems();

  let navClass = ['pcoded-navbar'];
  if (windowSize.width < 992 && collapseMenu) {
    navClass.push('mob-open');
  } else if (collapseMenu) {
    navClass.push('navbar-collapsed');
  }

  return (
    <nav className={navClass.join(' ')}>
      <div className="navbar-wrapper">
        <NavLogo />
        <NavContent navigation={navigation.items} />
      </div>
    </nav>
  );
};

export default Navigation;
