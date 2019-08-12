import React from 'react';
import Icon from 'Icon';
import classNames from 'classnames';
import './style.less';

// just a demo, can not run directly
const CIcon = ({ style, size, type, onClick }) => {
    if (type.indexOf('svg-') === 0) {
        const svgTag = require('@/assets/isvg/' + type.substr(4) + '.svg');
        const _class = `${size ? `svg-icon-${size}` : 'svg-icon'}`;
        return (
            <i
                className={classNames(cls, _class)}
                dangerouslySetInnerHTML={{ __html: svgTag }}
                onClick={onClick}
            />
        );
    } else {
        return <Icon style={style} icon={type} />;
    }
};

export default CIcon;